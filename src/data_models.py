from pydantic import BaseModel


class Segment(BaseModel):
    id: int
    name: str
    distance: float
    average_grade: float
    maximum_grade: float
    elevation_high: float
    elevation_low: float
    start_latlng: list[float, float]
    end_latlng: list[float, float]
