from typing import Optional

from pydantic import BaseModel, Field


class SearchToolArgs(BaseModel):
    query: str = Field(description="The query to search for in the codebase")


class CodebaseLoaderToolArgs(BaseModel):
    repository: str = Field(
        description="URL of the git repository OR the PyPi package name"
    )
