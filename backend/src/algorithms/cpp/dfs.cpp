/**
 * Depth-First Search (DFS) in Standard C++
 * Discipline: Design & Analysis of Algorithms (DAA)
 * 
 * Performs deterministic deep recursive traversal on an adjacency-list campus graph.
 * Explores along each pathway before backtracking.
 * 
 * Features:
 *   - Cycle avoidance using std::set<std::string>
 *   - Deterministic neighbor order following the adjacency vector
 *   - Spanning tree edge tracking (treeEdges)
 *   - Optional early halting upon discovery of destination node
 *   - Unreachable destination detection
 * 
 * Time Complexity:  O(V + E)
 * Space Complexity: O(V) auxiliary recursion/call stack space
 */

#include "graph_common.hpp"

// Global or encapsulated state for recursive traversal
struct DFSTraversalState {
    std::set<std::string> visited;
    std::vector<std::string> visitedNodes;
    std::vector<std::string> traversalOrder;
    std::vector<std::pair<std::string, std::string>> treeEdges;
    bool destinationFound = false;
};

void traverse(
    const std::string& current,
    const std::string& parent,
    const std::map<std::string, std::vector<std::string>>& graph,
    const GraphInput& input,
    DFSTraversalState& state
) {
    if (input.hasDestination && state.destinationFound) {
        return;
    }

    state.visited.insert(current);
    state.visitedNodes.push_back(current);
    state.traversalOrder.push_back(current);

    if (!parent.empty()) {
        state.treeEdges.push_back({parent, current});
    }

    if (input.hasDestination && current == input.destination) {
        state.destinationFound = true;
        return;
    }

    auto it = graph.find(current);
    if (it != graph.end()) {
        for (const std::string& neighbor : it->second) {
            if (neighbor.empty()) continue;

            if (state.visited.find(neighbor) == state.visited.end()) {
                traverse(neighbor, current, graph, input, state);
                if (input.hasDestination && state.destinationFound) {
                    return;
                }
            }
        }
    }
}

int main(int argc, char* argv[]) {
    // Read input from stdin JSON or CLI arguments
    GraphInput input = readProgramInput(argc, argv);

    // Validate start location
    if (input.start.empty()) {
        std::cout << "{\"success\":false,\"error\":\"Start location identifier is required and must be a non-empty string.\"}\n";
        return 0;
    }

    const auto& graph = input.graph;

    // Check existence of start node in graph
    if (graph.find(input.start) == graph.end()) {
        std::cout << "{\"success\":false,\"error\":\"Start location \\\"" << escapeJson(input.start) << "\\\" does not exist in the graph.\"}\n";
        return 0;
    }

    // Validate optional destination node if provided
    if (input.hasDestination && !input.destination.empty()) {
        if (graph.find(input.destination) == graph.end()) {
            std::cout << "{\"success\":false,\"error\":\"Destination location \\\"" << escapeJson(input.destination) << "\\\" does not exist in the graph.\"}\n";
            return 0;
        }
    }

    DFSTraversalState state;
    traverse(input.start, "", graph, input, state);

    // Format output JSON
    std::cout << "{\"success\":true,";
    std::cout << "\"start\":\"" << escapeJson(input.start) << "\",";

    if (input.hasDestination && !input.destination.empty()) {
        std::cout << "\"destination\":\"" << escapeJson(input.destination) << "\",";
        std::cout << "\"destinationFound\":" << (state.destinationFound ? "true" : "false") << ",";
    } else {
        std::cout << "\"destination\":null,";
        std::cout << "\"destinationFound\":null,";
    }

    // Traversal Order Array
    std::cout << "\"traversalOrder\":[";
    for (size_t i = 0; i < state.traversalOrder.size(); i++) {
        if (i > 0) std::cout << ",";
        std::cout << "\"" << escapeJson(state.traversalOrder[i]) << "\"";
    }
    std::cout << "],";

    // Visited Nodes Array
    std::cout << "\"visitedNodes\":[";
    for (size_t i = 0; i < state.visitedNodes.size(); i++) {
        if (i > 0) std::cout << ",";
        std::cout << "\"" << escapeJson(state.visitedNodes[i]) << "\"";
    }
    std::cout << "],";

    std::cout << "\"visitedCount\":" << state.visited.size() << ",";

    // Tree Edges Array [{ "from": "...", "to": "..." }]
    std::cout << "\"treeEdges\":[";
    for (size_t i = 0; i < state.treeEdges.size(); i++) {
        if (i > 0) std::cout << ",";
        std::cout << "{\"from\":\"" << escapeJson(state.treeEdges[i].first) << "\",\"to\":\"" << escapeJson(state.treeEdges[i].second) << "\"}";
    }
    std::cout << "],";

    // Formulate human-readable message
    std::string message;
    if (input.hasDestination && !input.destination.empty()) {
        if (state.destinationFound) {
            message = "DFS explored " + std::to_string(state.visited.size()) + " nodes and reached target \"" + input.destination + "\". Note: DFS does not guarantee the shortest path.";
        } else {
            message = "DFS explored all " + std::to_string(state.visited.size()) + " reachable nodes from \"" + input.start + "\", but target \"" + input.destination + "\" was unreachable.";
        }
    } else {
        message = "DFS explored all " + std::to_string(state.visited.size()) + " reachable nodes from \"" + input.start + "\".";
    }

    std::cout << "\"message\":\"" << escapeJson(message) << "\"";
    std::cout << "}\n";

    return 0;
}
