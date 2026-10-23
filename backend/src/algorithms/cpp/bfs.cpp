/**
 * Breadth-First Search (BFS) in Standard C++
 * Discipline: Design & Analysis of Algorithms (DAA)
 * 
 * Computes the optimal shortest path in an unweighted campus graph.
 * In an unweighted graph, BFS guarantees the minimum hop count because
 * vertices are explored level-by-level in non-decreasing order of distance.
 * 
 * Data structures used:
 *   - std::queue<std::string> for FIFO frontier management
 *   - std::set<std::string> for O(log V) visited set tracking
 *   - std::map<std::string, std::string> for predecessor/parent tracking
 *   - std::vector<std::string> for ordered traversal record
 * 
 * Time Complexity:  O(V + E)
 * Space Complexity: O(V) auxiliary space
 */

#include "graph_common.hpp"

int main(int argc, char* argv[]) {
    // Read input from stdin JSON or CLI arguments
    GraphInput input = readProgramInput(argc, argv);

    // Validate start location
    if (input.start.empty()) {
        std::cout << "{\"success\":false,\"error\":\"Start location identifier is required and must be a non-empty string.\"}\n";
        return 0;
    }

    // Validate destination location
    if (input.destination.empty()) {
        std::cout << "{\"success\":false,\"error\":\"Target destination identifier is required and must be a non-empty string.\"}\n";
        return 0;
    }

    const auto& graph = input.graph;

    // Check existence of start node in graph
    if (graph.find(input.start) == graph.end()) {
        std::cout << "{\"success\":false,\"error\":\"Start location \\\"" << escapeJson(input.start) << "\\\" does not exist in the graph.\"}\n";
        return 0;
    }

    // Check existence of destination node in graph
    if (graph.find(input.destination) == graph.end()) {
        std::cout << "{\"success\":false,\"error\":\"Destination location \\\"" << escapeJson(input.destination) << "\\\" does not exist in the graph.\"}\n";
        return 0;
    }

    // Base Case: Start and destination are identical
    if (input.start == input.destination) {
        std::cout << "{"
                  << "\"success\":true,"
                  << "\"found\":true,"
                  << "\"start\":\"" << escapeJson(input.start) << "\","
                  << "\"destination\":\"" << escapeJson(input.destination) << "\","
                  << "\"path\":[\"" << escapeJson(input.start) << "\"],"
                  << "\"pathLength\":0,"
                  << "\"traversalOrder\":[\"" << escapeJson(input.start) << "\"],"
                  << "\"visitedNodes\":[\"" << escapeJson(input.start) << "\"],"
                  << "\"visitedCount\":1,"
                  << "\"message\":\"Start and destination are identical (" << escapeJson(input.start) << "). Path length is 0 hops.\""
                  << "}\n";
        return 0;
    }

    // FIFO queue, visited set, and predecessor map
    std::queue<std::string> queue;
    std::set<std::string> visited;
    std::vector<std::string> visitedNodes;
    std::vector<std::string> traversalOrder;
    std::map<std::string, std::string> parentMap;

    queue.push(input.start);
    visited.insert(input.start);
    visitedNodes.push_back(input.start);
    parentMap[input.start] = "";

    bool found = false;

    while (!queue.empty()) {
        std::string current = queue.front();
        queue.pop();
        traversalOrder.push_back(current);

        if (current == input.destination) {
            found = true;
            break;
        }

        auto it = graph.find(current);
        if (it != graph.end()) {
            for (const std::string& neighbor : it->second) {
                if (visited.find(neighbor) == visited.end()) {
                    visited.insert(neighbor);
                    visitedNodes.push_back(neighbor);
                    parentMap[neighbor] = current;
                    queue.push(neighbor);
                }
            }
        }
    }

    // Format output JSON
    std::cout << "{\"success\":true,\"found\":" << (found ? "true" : "false") << ",";
    std::cout << "\"start\":\"" << escapeJson(input.start) << "\",";
    std::cout << "\"destination\":\"" << escapeJson(input.destination) << "\",";

    if (found) {
        // Reconstruct path from destination to start
        std::vector<std::string> path;
        std::string curr = input.destination;
        while (!curr.empty()) {
            path.push_back(curr);
            curr = parentMap[curr];
        }
        std::reverse(path.begin(), path.end());

        std::cout << "\"path\":[";
        for (size_t i = 0; i < path.size(); i++) {
            if (i > 0) std::cout << ",";
            std::cout << "\"" << escapeJson(path[i]) << "\"";
        }
        std::cout << "],";

        int hops = static_cast<int>(path.size()) - 1;
        std::cout << "\"pathLength\":" << hops << ",";

        std::ostringstream pathStr;
        for (size_t i = 0; i < path.size(); i++) {
            if (i > 0) pathStr << " -> ";
            pathStr << path[i];
        }

        std::cout << "\"message\":\"Shortest path discovered with " << hops << " hops (" << escapeJson(pathStr.str()) << ").\",";
    } else {
        std::cout << "\"path\":[],\"pathLength\":-1,";
        std::cout << "\"message\":\"No path exists from \\\"" << escapeJson(input.start) << "\\\" to \\\"" << escapeJson(input.destination) << "\\\". Landmark is unreachable in the current graph.\",";
    }

    // Traversal Order Array
    std::cout << "\"traversalOrder\":[";
    for (size_t i = 0; i < traversalOrder.size(); i++) {
        if (i > 0) std::cout << ",";
        std::cout << "\"" << escapeJson(traversalOrder[i]) << "\"";
    }
    std::cout << "],";

    // Visited Nodes Array
    std::cout << "\"visitedNodes\":[";
    for (size_t i = 0; i < visitedNodes.size(); i++) {
        if (i > 0) std::cout << ",";
        std::cout << "\"" << escapeJson(visitedNodes[i]) << "\"";
    }
    std::cout << "],";

    std::cout << "\"visitedCount\":" << visited.size();
    std::cout << "}\n";

    return 0;
}
