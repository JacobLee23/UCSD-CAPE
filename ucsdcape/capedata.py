"""
"""

import json
import pathlib
import typing

import pandas as pd


class _CAPEData:
    """
    """
    def __init__(self, path: typing.Union[str, pathlib.Path], capetype: str):
        self.path = pathlib.Path(path)
        if self.path.suffix != ".json":
            raise ValueError(
                f"expected .json file extension, got {self.path.suffix}"
            )
        
        with open(self.path, "r", encoding="utf-8") as file:
            self.capedata = dict(json.load(file))

        self.capetype = capetype
        if self.capedata.get("capeType") != self.capetype:
            raise ValueError


class CAPEResults(_CAPEData):
    """
    """
    def __init__(self, path: typing.Union[str, pathlib.Path]):
        super().__init__(path, "results")

    def __repr__(self) -> str:
        return f"{type(self).__name__}(name='{self.name}', course_number='{self.course_number}')"

    @property
    def name(self) -> str:
        """
        """
        return self.capedata.get("name")
    
    @property
    def course_number(self) -> str:
        """
        """
        return self.capedata.get("courseNumber")
    
    @property
    def data(self) -> pd.DataFrame:
        """
        """
        data = self.capedata.get("data")
        return pd.DataFrame(columns=data[0], data=data[1:])


class CAPEReport(_CAPEData):
    """
    """
    def __init__(self, path: typing.Union[str, pathlib.Path]):
        super().__init__(path, "report")

    def __repr__(self) -> str:
        return f"{type(self).__name__}(section_id={self.section_id})"

    @property
    def section_id(self) -> int:
        """
        """
        return self.capedata.get("sectionID")
