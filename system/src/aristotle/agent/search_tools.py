import json

from langchain_core.tools import BaseTool
from langgraph.pregel.main import asyncio

from aristotle import project_config
from aristotle.kbs.query_filter import (combine_filter_search_information,
                                        filter_docs_search,
                                        filter_graph_search)

from .args_schemas import SearchToolArgs
from .databases import docs_db, graph_db


class CombinedSearchTool(BaseTool):
    name: str = "search"
    description: str = (
        "Search for entities, relationships, and code documentations in the codebase."
        "Provide a 'query' describing what to find in detail along with the codebase name."
    )

    def __init__(self) -> None:
        super().__init__()
        self.args_schema = SearchToolArgs

    async def _run(self, query: str) -> str:
        print(f"[WARN] Agent combined searched (sync run): '{query}'")
        try:
            loop = asyncio.get_running_loop()
            return loop.create_task(self._arun(query)).result()
        except Exception as e:
            print("[ERROR]:", e)
            return f"Error: {str(e)}"

    async def _arun(self, query: str) -> str:
        print(f"[INFO] Agent combined searched (async run): '{query}'")
        try:
            graph_information = await graph_db.search(query)
            docs_information = docs_db.search(query)
            combined_result = json.dumps(
                combine_filter_search_information(graph_information, docs_information)
            )
            if project_config.enable_evaluation:
                with open(project_config.evaluation_temp_file, "w") as f:
                    f.write(combined_result)
            else:
                print("[INFO] Combined search result:", combined_result)
            return combined_result
        except Exception as e:
            print("[ERROR] While combined search:", e)
            return f"Error: {str(e)}"


class GraphSearchTool(BaseTool):
    name: str = "search_code"
    description: str = (
        "Search for entities and relationships of source code in the codebase."
        "Provide a 'query' describing what to find in detail along with the codebase name."
    )

    def __init__(self) -> None:
        super().__init__()
        self.args_schema = SearchToolArgs

    async def _run(self, query: str) -> str:
        print(f"[WARN] Agent graph only searched (sync run): '{query}'")
        try:
            loop = asyncio.get_running_loop()
            return loop.create_task(self._arun(query)).result()
        except Exception as e:
            print("[ERROR]:", e)
            return f"Error: {str(e)}"

    async def _arun(self, query: str) -> str:
        print(f"[INFO] Agent graph only searched (async run): '{query}'")
        try:
            graph_information = await graph_db.search(query)
            print("[INFO] Graph search result:", graph_information)
            return json.dumps(filter_graph_search(graph_information))
        except Exception as e:
            print("[ERROR]:", e)
            return f"Error: {str(e)}"


class DocumentationsSearchTool(BaseTool):
    name: str = "search_docs"
    description: str = (
        "Search for code documentation chunks in the codebase."
        "Provide a 'query' describing what to find in detail along with the codebase name."
    )

    def __init__(self) -> None:
        super().__init__()
        self.args_schema = SearchToolArgs

    def _run(self, query: str) -> str:
        print(f"[INFO] Agent docs only searched: '{query}'")
        try:
            docs_information = docs_db.search(query)
            print("[INFO] Docs search result:", docs_information)
            return json.dumps(filter_docs_search(docs_information))
        except Exception as e:
            print("[ERROR]:", e)
            return f"Error: {str(e)}"
