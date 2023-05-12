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
    class _GradeDistribution(typing.NamedTuple):
        """
        """
        average_grade: str
        gpa: float
        distribution: pd.DataFrame

    class _ResponseDistribution(typing.NamedTuple):
        """
        """
        prompt: str
        n: int
        mean: float
        std: float
        distribution: pd.DataFrame

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
        return self.data.get("grades")
    
    @property
    def questionnaire(self) -> typing.List[typing.Dict[str, typing.Any]]:
        """
        """
        return self.data.get("questionnaire")
        
    def grade_distributions(self) -> typing.Tuple[str, _GradeDistribution]:
        """
        """
        field_names = ("expected", "received")
        GradeDistributions = collections.namedtuple("GradeDistributions", field_names)

        res = {}
        for name in field_names:
            grade_data = self.grades[name]
            distribution = self._GradeDistribution(
                grade_data["avgGrade"],
                grade_data["gpa"],
                pd.DataFrame(grade_data["grades"])
            )
            res.setdefault(name, distribution)

        return GradeDistributions(**res)

    def response_distributions(self) -> typing.Dict[str, pd.DataFrame]:
        """
        """
        field_names = (
            "class_levels", "enrollment_reasons", "expected_grades",
            "degree_of_learning", "study_hours_per_week", "attendance_frequency",
            "intellectually_stimulating", "promotion_of_learning", "usefulness_of_reading",
            "relative_difficulty", "exam_representativeness", "recommend_course",
            "instructor_proficiency", "instructor_preparedness", "instructor_comprehensibility",
            "explanation_quality", "interest_of_lecture", "facilitation_of_notetaking",
            "concern_for_student_learning", "promotion_of_discussion", "instructor_accessability",
            "instructor_timeliness", "recommend_instructor"
        )
        ResponseDistributions = collections.namedtuple("ResponseDistributions", field_names)

        excluded_columns = ("prompt", "n", "mean", "std")

        res = {}
        for ind, name in enumerate(field_names):
            response_data = self.questionnaire[ind]
            distribution = self._ResponseDistribution(
                response_data["prompt"],
                response_data["n"],
                np.nan if response_data["mean"] is None else response_data["mean"],
                np.nan if response_data["std"] is None else response_data["std"],
                pd.DataFrame(
                    {k: v for k, v in response_data.items() if k not in excluded_columns}
                )
            )
            res.setdefault(name, distribution)

        return ResponseDistributions(**res)

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
