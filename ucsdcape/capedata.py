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
    
    def __getitem__(self, key: str) -> typing.Any:
        return self.data.get(key)

    @property
    def data(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.capedata.get("data")


class CAPEResults(_CAPEData):
    """
    """
    def __init__(self, path: typing.Union[str, pathlib.Path]):
        super().__init__(path, "CAPEResults")

    def __repr__(self) -> str:
        return f"{type(self).__name__}(name='{self.name}', course_number='{self.course_number}')"

    def __getitem__(self, key: str) -> typing.Optional[pd.Series]:
        try:
            return self.data.loc[:, key]
        except KeyError:
            return None

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
        super().__init__(path, "CAPEReport")

    def __repr__(self) -> str:
        return f"{type(self).__name__}(section_id={self.section_id})"

    @property
    def section_id(self) -> int:
        """
        """
        return self.capedata.get("sectionID")
    
    @property
    def report_title(self) -> str:
        """
        """
        return self.data.get("reportTitle")
    
    @property
    def course_description(self) -> str:
        """
        """
        return self.data.get("courseDescription")
    
    @property
    def instructor(self) -> str:
        """
        """
        return self.data.get("instructor")
    
    @property
    def quarter(self) -> str:
        """
        """
        return self.data.get("quarter")
    
    @property
    def term(self) -> int:
        """
        """
        return self.data.get("term")
    
    @property
    def evaluations(self) -> int:
        """
        """
        return self.data.get("evaluations")
    
    @property
    def statistics(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("statistics")
    
    @property
    def grades(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("grades")
    
    @property
    def questionnaire(self) -> typing.List[typing.Dict[str, typing.Any]]:
        """
        """
        return self.data.get("questionnaire")


class SelfCAPE(_CAPEData):
    """
    """
    def __init__(self, path: typing.Union[str, pathlib.Path]):
        super().__init__(path, "SelfCAPE")

    def __repr__(self) -> str:
        return f"{type(self).__name__}(section_id={self.section_id})"
    
    @property
    def section_id(self) -> int:
        """
        """
        return self.capedata.get("sectionID")

    @property
    def subject(self) -> str:
        """
        """
        return self.data.get("subject")
    
    @property
    def course_number(self) -> str:
        """
        """
        return self.data.get("courseNumber")
    
    @property
    def instructor(self) -> str:
        """
        """
        return self.data.get("instructor")
    
    @property
    def term(self) -> str:
        """
        """
        return self.data.get("term")
    
    @property
    def enrollment(self) -> int:
        """
        """
        return self.data.get("enrollment")
    
    @property
    def evaluations(self) -> int:
        """
        """
        return self.data.get("evaluations")
    
    @property
    def class_level(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("classLevel")
    
    @property
    def enrollment_reason(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("enrollmentReason")
    
    @property
    def expected_grade(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("expectedGrade")
    
    @property
    def questionnaire(self) -> typing.List[typing.Dict[str, typing.Any]]:
        """
        """
        return self.data.get("questionnaire")
    
    @property
    def study_hours_per_week(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("studyHoursPerWeek")
    
    @property
    def attendance_frequency(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("attendanceFrequency")
    
    @property
    def recommend_course(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("recommendCourse")
    
    @property
    def recommend_instructor(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("recommendInstructor")
