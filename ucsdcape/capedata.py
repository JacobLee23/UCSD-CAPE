"""
"""

import collections
import json
import pathlib
import typing

import numpy as np
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

    def get_distribution(self, data: typing.Dict[str, typing.Any], field_names: typing.Sequence[str] = ("prompt", "n")):
        """
        """
        Distribution = collections.namedtuple("Distribution", [*field_names, "distribution"])

        distribution = Distribution(
            **{k: data[k] for k in field_names},
            distribution=pd.DataFrame(
                {k: v for k, v in data.items() if k not in field_names}
            ).transpose()
        )

        return distribution


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
    def term(self) -> int:
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
    def statistics(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.data.get("statistics")
    
    @property
    def grades(self) -> typing.Dict[str, typing.Any]:
        """
        """
        distribution_names = ("expected", "received")
        GradeDistributions = collections.namedtuple("GradeDistributions", distribution_names)

        field_names = ("avgGrade", "gpa")

        data = {}
        for name in distribution_names:
            data.setdefault(name, self.get_distribution(self.data["grades"][name], field_names))

        return GradeDistributions(**data)
    
    @property
    def questionnaire(self) -> typing.List[typing.Dict[str, typing.Any]]:
        """
        """
        distribution_names = (
            "class_level", "enrollment_reason", "expected_grade",
            "degree_of_learning", "study_hours_per_week", "attendance_frequency",
            "intellectually_stimulating", "promotion_of_learning", "usefulness_of_reading",
            "relative_difficulty", "exam_representativeness", "recommend_course",
            "instructor_proficiency", "instructor_preparedness", "instructor_comprehensibility",
            "explanation_quality", "interest_of_lecture", "facilitation_of_notetaking",
            "concern_for_student_learning", "promotion_of_discussion", "instructor_accessability",
            "instructor_timeliness", "recommend_instructor"
        )
        ResponseDistributions = collections.namedtuple("ResponseDistributions", distribution_names)

        field_names = ("prompt", "n", "mean", "std")

        data = {}
        for ind, name in enumerate(distribution_names):
            data.setdefault(
                name, self.get_distribution(self.data["questionnaire"][ind], field_names)
            )

        return ResponseDistributions(**data)


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
        return self.get_distribution(self.data["classLevel"])
    
    @property
    def enrollment_reason(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.get_distribution(self.data["enrollmentReason"])
    
    @property
    def expected_grade(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.get_distribution(
            self.data["expectedGrade"], ("prompt", "n", "expectedGPA")
        )
    
    @property
    def questionnaire(self) -> typing.List[typing.Dict[str, typing.Any]]:
        """
        """
        return self.data.get("questionnaire")
    
    @property
    def study_hours_per_week(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.get_distribution(
            self.data["studyHoursPerWeek"], ("prompt", "n", "mean")
        )
    
    @property
    def attendance_frequency(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.get_distribution(self.data["attendanceFrequency"])
    
    @property
    def recommend_course(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.get_distribution(self.data["recommendCourse"])
    
    @property
    def recommend_instructor(self) -> typing.Dict[str, typing.Any]:
        """
        """
        return self.get_distribution(self.data["recommendInstructor"])
