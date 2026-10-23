#ifndef GRAPH_COMMON_HPP
#define GRAPH_COMMON_HPP

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <queue>
#include <sstream>
#include <algorithm>
#include <cctype>

#if defined(_WIN32)
#include <io.h>
#define IS_STDIN_TTY() (_isatty(_fileno(stdin)) != 0)
#else
#include <unistd.h>
#define IS_STDIN_TTY() (isatty(fileno(stdin)) != 0)
#endif

/**
 * Canonical Kalvium Campus Graph (6 Landmarks, 9 Pathways)
 * Consistent with backend/src/data/campusGraph.js
 */
inline std::map<std::string, std::vector<std::string>> getDefaultCampusGraph() {
    return {
        {"GATE", {"BLOCK_A", "LIBRARY"}},
        {"BLOCK_A", {"GATE", "LIBRARY", "CAFETERIA", "LAB"}},
        {"LIBRARY", {"GATE", "BLOCK_A", "LAB"}},
        {"CAFETERIA", {"BLOCK_A", "LAB", "HOSTEL"}},
        {"LAB", {"BLOCK_A", "LIBRARY", "CAFETERIA", "HOSTEL"}},
        {"HOSTEL", {"CAFETERIA", "LAB"}}
    };
}

// Data structure holding parsed algorithm inputs
struct GraphInput {
    std::string start;
    std::string destination;
    bool hasDestination = false;
    std::map<std::string, std::vector<std::string>> graph;
    bool hasCustomGraph = false;
};

// String helper utilities
inline std::string trim(const std::string& str) {
    size_t first = str.find_first_not_of(" \t\n\r");
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(" \t\n\r");
    return str.substr(first, (last - first + 1));
}

inline std::string toUpper(std::string str) {
    for (char &c : str) {
        c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
    }
    return str;
}

inline std::string escapeJson(const std::string& s) {
    std::ostringstream o;
    for (char c : s) {
        switch (c) {
            case '"': o << "\\\""; break;
            case '\\': o << "\\\\"; break;
            case '\b': o << "\\b"; break;
            case '\f': o << "\\f"; break;
            case '\n': o << "\\n"; break;
            case '\r': o << "\\r"; break;
            case '\t': o << "\\t"; break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    o << "\\u00" << (c < 16 ? "0" : "") << std::hex << static_cast<int>(c);
                } else {
                    o << c;
                }
        }
    }
    return o.str();
}

namespace json_parser {

inline void skipWhitespace(const std::string& s, size_t& pos) {
    while (pos < s.size() && (s[pos] == ' ' || s[pos] == '\t' || s[pos] == '\n' || s[pos] == '\r')) {
        pos++;
    }
}

inline std::string parseString(const std::string& s, size_t& pos) {
    skipWhitespace(s, pos);
    if (pos >= s.size() || s[pos] != '"') return "";
    pos++; // skip opening quote
    std::string result;
    while (pos < s.size()) {
        char c = s[pos++];
        if (c == '"') {
            break;
        } else if (c == '\\' && pos < s.size()) {
            char next = s[pos++];
            if (next == '"') result += '"';
            else if (next == '\\') result += '\\';
            else if (next == '/') result += '/';
            else if (next == 'b') result += '\b';
            else if (next == 'f') result += '\f';
            else if (next == 'n') result += '\n';
            else if (next == 'r') result += '\r';
            else if (next == 't') result += '\t';
            else result += next;
        } else {
            result += c;
        }
    }
    return result;
}

inline std::vector<std::string> parseStringArray(const std::string& s, size_t& pos) {
    skipWhitespace(s, pos);
    std::vector<std::string> arr;
    if (pos >= s.size() || s[pos] != '[') return arr;
    pos++; // skip '['

    while (pos < s.size()) {
        skipWhitespace(s, pos);
        if (pos >= s.size() || s[pos] == ']') {
            if (pos < s.size()) pos++; // skip ']'
            break;
        }
        if (s[pos] == '"') {
            arr.push_back(parseString(s, pos));
        } else {
            pos++;
        }
        skipWhitespace(s, pos);
        if (pos < s.size() && s[pos] == ',') {
            pos++;
        }
    }
    return arr;
}

inline std::map<std::string, std::vector<std::string>> parseGraphObject(const std::string& s, size_t& pos) {
    skipWhitespace(s, pos);
    std::map<std::string, std::vector<std::string>> graph;
    if (pos >= s.size() || s[pos] != '{') return graph;
    pos++; // skip '{'

    while (pos < s.size()) {
        skipWhitespace(s, pos);
        if (pos >= s.size() || s[pos] == '}') {
            if (pos < s.size()) pos++; // skip '}'
            break;
        }

        std::string key = parseString(s, pos);
        skipWhitespace(s, pos);
        if (pos < s.size() && s[pos] == ':') pos++; // skip ':'
        skipWhitespace(s, pos);

        std::vector<std::string> neighbors = parseStringArray(s, pos);
        if (!key.empty()) {
            graph[key] = neighbors;
        }

        skipWhitespace(s, pos);
        if (pos < s.size() && s[pos] == ',') {
            pos++;
        }
    }
    return graph;
}

inline GraphInput parseJsonInput(const std::string& jsonStr) {
    GraphInput input;
    size_t pos = 0;
    skipWhitespace(jsonStr, pos);

    if (pos >= jsonStr.size() || jsonStr[pos] != '{') {
        return input;
    }
    pos++; // skip '{'

    while (pos < jsonStr.size()) {
        skipWhitespace(jsonStr, pos);
        if (pos >= jsonStr.size() || jsonStr[pos] == '}') {
            break;
        }

        std::string key = parseString(jsonStr, pos);
        skipWhitespace(jsonStr, pos);
        if (pos < jsonStr.size() && jsonStr[pos] == ':') pos++;
        skipWhitespace(jsonStr, pos);

        if (key == "start" || key == "startNode") {
            input.start = parseString(jsonStr, pos);
        } else if (key == "destination" || key == "targetNode" || key == "target") {
            if (pos < jsonStr.size() && jsonStr[pos] == '"') {
                input.destination = parseString(jsonStr, pos);
                input.hasDestination = true;
            } else if (jsonStr.substr(pos, 4) == "null") {
                pos += 4;
                input.destination = "";
                input.hasDestination = false;
            } else {
                // skip unquoted value
                while (pos < jsonStr.size() && jsonStr[pos] != ',' && jsonStr[pos] != '}') pos++;
            }
        } else if (key == "graph") {
            input.graph = parseGraphObject(jsonStr, pos);
            input.hasCustomGraph = !input.graph.empty();
        } else {
            // skip unrecognized value
            if (pos < jsonStr.size() && jsonStr[pos] == '"') {
                parseString(jsonStr, pos);
            } else if (pos < jsonStr.size() && jsonStr[pos] == '{') {
                int depth = 1;
                pos++;
                while (pos < jsonStr.size() && depth > 0) {
                    if (jsonStr[pos] == '{') depth++;
                    else if (jsonStr[pos] == '}') depth--;
                    pos++;
                }
            } else if (pos < jsonStr.size() && jsonStr[pos] == '[') {
                int depth = 1;
                pos++;
                while (pos < jsonStr.size() && depth > 0) {
                    if (jsonStr[pos] == '[') depth++;
                    else if (jsonStr[pos] == ']') depth--;
                    pos++;
                }
            } else {
                while (pos < jsonStr.size() && jsonStr[pos] != ',' && jsonStr[pos] != '}') pos++;
            }
        }

        skipWhitespace(jsonStr, pos);
        if (pos < jsonStr.size() && jsonStr[pos] == ',') {
            pos++;
        }
    }

    if (!input.hasCustomGraph) {
        input.graph = getDefaultCampusGraph();
    }

    return input;
}

} // namespace json_parser

/**
 * Reads input from stdin (JSON string) or falls back to argv CLI parameters.
 */
inline GraphInput readProgramInput(int argc, char* argv[]) {
    // If stdin is redirected/piped (not an interactive terminal keyboard)
    if (!IS_STDIN_TTY()) {
        std::string stdinContent;
        std::cin >> std::noskipws;
        char ch;
        while (std::cin >> ch) {
            stdinContent += ch;
        }

        std::string trimmedInput = trim(stdinContent);
        if (!trimmedInput.empty() && trimmedInput.front() == '{') {
            GraphInput input = json_parser::parseJsonInput(trimmedInput);
            if (!input.destination.empty()) {
                input.hasDestination = true;
            }
            return input;
        }
    }

    // Fallback to CLI arguments
    GraphInput input;
    if (argc >= 2) {
        input.start = trim(argv[1]);
    }
    if (argc >= 3) {
        input.destination = trim(argv[2]);
        input.hasDestination = !input.destination.empty();
    }
    input.graph = getDefaultCampusGraph();
    return input;
}

#endif // GRAPH_COMMON_HPP
