import datetime
from src.config import Config
from src.data_source.strava import (
    get_segments,
    get_starred_segments,
    get_segment_effort,
)


def main():
    start = datetime.datetime(2024, 1, 1)
    end = datetime.datetime(2024, 12, 31)
    start = start.replace(tzinfo=datetime.timezone.utc)
    end = end.replace(tzinfo=datetime.timezone.utc)
    p1 = [-34.05237976642294, 150.95808351227984]
    p2 = [-34.0222649517388, 150.98412764485752]
    conf = Config()
    # get_segments(conf, p1, p2)
    segments = get_starred_segments(conf)

    for seg in segments:
        get_segment_effort(conf, seg.id, start, end)


if __name__ == "__main__":
    main()
