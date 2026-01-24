import axios from 'axios';

export interface GetChartDataParams {
  datetime: string; // '1979-04-22T04:40:00'
  latitude: number; // 59.437
  longitude: number; // 24.7535
  timezone: string; // 'Europe/Tallinn'
}

export interface AstroPlanet {
  name: string;
  sign: string;
  degree: number;
  isRetrograde: boolean;
}

export interface AstroHouse {
  house: number;
  sign: string;
  degree: number;
}

export interface AstroChartData {
  planets: AstroPlanet[];
  houses: AstroHouse[];
  ascendant: string;
  midheaven: string;
}

export async function getChartData({
  datetime,
  latitude,
  longitude,
  timezone,
}: GetChartDataParams): Promise<AstroChartData> {
  const endpoint = 'https://zodiac-api.onrender.com/graphql';

  const query = `
    query GetChart($datetime: String!, $lat: Float!, $lon: Float!, $tz: String!) {
      chart(datetime: $datetime, latitude: $lat, longitude: $lon, timezone: $tz) {
        planets {
          name
          sign
          degree
          isRetrograde
        }
        houses {
          house
          sign
          degree
        }
        ascendant
        midheaven
      }
    }
  `;

  const variables = {
    datetime,
    lat: latitude,
    lon: longitude,
    tz: timezone,
  };

  const response = await axios.post<{
    data: {
      chart: AstroChartData;
    };
  }>(
    endpoint,
    { query, variables },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data.data.chart;
}
