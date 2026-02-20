# Washington Walkability Dashboard

<details style="font-size: 0.85em; color: gray;">
  <summary>AI Disclosure</summary>
    I used AI in this assignment for debugging only. I did not use AI to write or complete any components where AI use is prohibited. I am able to explain all relevant code and decisions.
</details>

**Live Web Map:**  
https://latw12345.github.io/wa-walkability-dashboard

## Project Overview

This project implements a smart geospatial dashboard visualizing the National Walkability Index across Washington State. The dashboard integrates a choropleth map, two dynamically updating histograms, summary statistics, and interactive filters to support exploratory spatial analysis.

The goal of this dashboard is not only to map walkability, but to examine how walkability relates to:

- Physical land coverage (surface area)
- Population distribution
- Built-environment structure across urban and rural contexts

The application was developed using Mapbox GL JS for mapping and C3.js (built on D3.js) for dynamic charting.

## Geographical Phenomenon

The dashboard visualizes neighborhood walkability as measured by the U.S. Environmental Protection Agency’s National Walkability Index.

The National Walkability Index is a composite metric (scale: 1–20) derived from built-environment characteristics including:

- Employment and household mix (D2A_EPHHM)
- Land-use diversity (D2B_E8MIXA)
- Street network connectivity (D3B)
- Transit accessibility (D4A)

Higher values indicate environments where destinations are closer together, land uses are mixed, and connectivity supports non-automobile travel.

The dataset is mapped at the census block group level and includes additional attributes such as total population and land area.

## Thematic Map Design Choice

This dashboard uses a choropleth map to represent walkability.

A choropleth was selected because:

- The National Walkability Index is a continuous numeric variable.
- The data are polygon-based (census block groups).
- Spatial comparison between neighboring units is meaningful.
- The index is standardized (1–20 scale), making classification appropriate.

Walkability values are grouped into five legend classes:
1–5, 6–9, 10–12, 13–14, and 15–20.

A proportional symbol map would not be appropriate because the phenomenon represents areal intensity rather than magnitude at point locations.

## Additional Data Visualization Components

The dashboard includes two additional dynamic visualization components beyond the map.

### 1. Surface Area by Walkability

The first histogram aggregates total land area within 2-point walkability bins (1–2, 3–4, ..., 19–20).

This chart measures the spatial footprint of walkability categories. It reveals how much of Washington’s physical land area falls into each level of built-environment intensity.

This approach highlights contrasts between:
- Large rural, low-density areas
- Smaller but more concentrated urban environments

### 2. Population by Walkability

The second histogram aggregates total population  within the same 2-point walkability bins.

Rather than measuring land coverage, this chart measures population concentration within each walkability level.

Together, the two histograms allow direct comparison between:
- Spatial dominance (acres)
- Residential concentration (population)

### 3. Interactive Filtering

The dashboard includes:

- Walkability range slider (1–20)
- Population range slider (0-7,300)
- Real-time summary statistics:
  - Visible block groups
  - Average walkability
  - Total population

When filters are applied:
- The map uses opacity changes to preserve geographic context.
- Both histograms recalculate values dynamically.
- Summary metrics update immediately.

This interactive design transforms the dashboard from static display to exploratory analytical tool.

## Data Sources

Primary dataset:

U.S. Environmental Protection Agency  
National Walkability Index (Smart Location Database)  
https://catalog.data.gov/dataset/walkability-index8

Attributes used in this dashboard include:

- `NatWalkInd` (National Walkability Index)
- `TotPop` (Total Population)
- `Ac_Land` (Land Area in acres)
- `GEOID20` (Census Block Group Identifier)
- Component indicators (`D2A_EPHHM`, `D2B_E8MIXA`, `D3B`, `D4A`)

The original nationwide Smart Location Database was filtered to include only census block groups within Washington State, and the resulting subset was exported and stored in:
assets/WashingtonWalkabilityIndex.geojson

## Limitations

- The National Walkability Index measures built-environment structure, not observed walking behavior.
- It does not account for sidewalk condition, safety, crime, topography, or pedestrian infrastructure quality.
- Block group aggregation may mask within-neighborhood variation.
- Surface-area comparisons may overrepresent large rural polygons.
- Data represent a specific time period and may not capture recent land-use changes.
