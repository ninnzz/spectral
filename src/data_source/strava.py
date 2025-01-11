import datetime
import requests
from src.config import Config
from src.data_models import Segment


def get_segments(conf: Config, p1: list, p2: list) -> list:
    """
    Gets all segments from given bounds.

    :param conf:
    :param p1:
    :param p2:
    :return:
    """

    url = "https://www.strava.com/api/v3/segments/explore"
    header = {"Authorization": f"Bearer {conf.strava_access_token}"}
    params = {
        "bounds": ",".join(map(str, p1 + p2)),
        "activity_type": "riding",
        # "min_cat": 0,
        # "max_cat": 0
    }

    print(params)

    r = requests.get(url, params=params, headers=header)

    if r.status_code != 200:
        print(r.status_code)
        raise ValueError("Problem fetching segments data")

    data = r.json()
    print(data.keys())

    for segment in data["segments"]:
        print(segment["name"])

    if r.status_code != 200:
        print(r.text)
        raise ValueError("Problem fetching segments data")

    data = r.json()

    return [Segment(**d) for d in data]


def get_segment_effort(
    conf: Config,
    segment_id: int,
    start: datetime.date,
    end: datetime.date,
    per_page: int = 100,
) -> list[Segment]:
    """
    Gets segement effort.

    :param conf:
    :param segment_id:
    :param start:
    :param end:
    :param per_page:
    :return:
    """
    url = "https://www.strava.com/api/v3/segment_efforts"
    header = {"Authorization": f"Bearer {conf.strava_access_token}"}
    params = {
        "segment_id": segment_id,
        "start_date_local": start.isoformat(),
        "end_date_local": end.isoformat(),
        "per_page": per_page,
    }
    print(params)
    r = requests.get(url, params=params, headers=header)

    if r.status_code != 200:
        print(r.text)
        raise ValueError("Problem fetching segments data")

    data = r.json()

    print(data)
    for i in data:
        print(i)

    return []


def get_starred_segments(conf: Config) -> list[Segment]:
    """
    Gets all segments from given bounds.

    :param conf:
    :return:
    """
    url = "https://www.strava.com/api/v3/segments/starred"
    header = {"Authorization": f"Bearer {conf.strava_access_token}"}
    params = {"per_page": 50}

    r = requests.get(url, params=params, headers=header)

    if r.status_code != 200:
        print(r.text)
        raise ValueError("Problem fetching segments data")

    data = r.json()

    return [Segment(**d) for d in data]
