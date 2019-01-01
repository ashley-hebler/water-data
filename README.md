# Water Data
Experimenting with GraphQL and USGS water data.

[Playground](https://water-data-9n9uilv1d.now.sh/)

[USGS API Args](https://waterservices.usgs.gov/rest/IV-Service.html#Service)
[USGS Site Types](https://help.waterdata.usgs.gov/site_tp_cd)
[USGS Param codes](https://help.waterdata.usgs.gov/codes-and-parameters/parameters)
[USGS Param codes 2](https://help.waterdata.usgs.gov/code/parameter_cd_nm_query?parm_nm_cd=%25temperature%25&fmt=html)
[USGS Param codes 3](https://help.waterdata.usgs.gov/parameter_cd?group_cd=INF)

[Sample Endpoint](https://waterservices.usgs.gov/nwis/iv/?stateCd=tx&format=json&parameterCd=00010&period=PT2H&siteType=ST)
`https://waterservices.usgs.gov/nwis/iv/?stateCd=tx&format=json&parameterCd=00010&period=PT2H&siteType=ST`

Sample Query

```
query {
  water(state: "TX") {
    closest(lat:"29.6911744", long: "-97.9970414")
    counts {
      label
      count
    }
    sites {
      type,
      name
    }
  }
}
```