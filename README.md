## Trail Project

#### Checklist

- [ ] Get specific segments of trail from a defined lat long bounds
- [ ] Get the following stats for each trail/segments
  - riders per date (month default)
  - speed of riders
  - return rate of riders
  - age of riders (optional)
  - kit of riders (optional)

### Requirements

##### Strava API

The project requires a `.env` file that contains your strava credentials.

```shell
strava_client_secret="<value_here>"
strava_client_id="<value_here>"
strava_access_token="<value_here>"
```

##### Python setup

- Poetry 1.7.1+
- Python 3.11+

```shell
poetry install
```

Running data fetch

```shell
poetry run python scrape_data_entry.py
```

Running notebooks

```shell
poetry run jupyter notebook
```