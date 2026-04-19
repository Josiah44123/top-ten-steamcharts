from fileinput import filename

import pandas as pd

filename = 'Data/CSV_DATA/PastTopCharts.csv'

def convert_to_csv(df):
    df.to_csv(filename)

def load_csv():
    print("Loading CSV")
    df = pd.read_csv(filename, index_col=0)

    return df