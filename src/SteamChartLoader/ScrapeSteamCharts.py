from datetime import datetime
import json
import requests
from io import StringIO

from SteamChartLoader.CSVScript import *

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
url = 'https://steamcharts.com/top'


def clean_charts(currentTopDf):
    print("Cleaning charts...")

    currentTopDf.columns = range(currentTopDf.shape[1])

    currentTopDf = currentTopDf[[0, 1, 2]]

    # Select Top 10
    currentTopDf = currentTopDf.iloc[0:10]

    currentTopDf = currentTopDf.rename(columns={0: 'Current position', 1: 'Game Name', 2: 'Current Players'})

    return currentTopDf


def compare_to_past_top(currentTopDf):
    pastTopDf = load_csv()

    for index, row in pastTopDf.iterrows():
        GameName = row['Game Name']
        pastPosition = row['Current position']
        currentTopDf.loc[currentTopDf['Game Name'] == GameName, 'Past position'] = pastPosition


def update_charts():
    print("Updating charts...")
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    tables = pd.read_html(StringIO(response.text))
    currentTopDf = tables[0]

    currentTopDf = clean_charts(currentTopDf)

    # Compare past position to pastTopCharts
    # None is less than top 10
    currentTopDf['Past position'] = None
    compare_to_past_top(currentTopDf)
    convert_to_csv(currentTopDf)

    last_updated = datetime.now()
    print(f"Last updated at {last_updated}")
    print(currentTopDf)

    return currentTopDf.to_json(orient='records')



