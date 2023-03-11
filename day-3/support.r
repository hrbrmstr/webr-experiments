library(dplyr)

month <- \(x, abb=TRUE) { 
  m <- as.POSIXlt(x)$mon + 1
  if (abb[1]) month.abb[m] else month.name[m]
}

year <- \(x) { as.POSIXlt(x)$year + 1900 }

two_col_df_to_named_list <- \(df) {
  with(df, tapply(n, source, FUN=I)) |> 
	 as.list()
}

setup_data <- \(url = "https://rud.is/webr-dash/subs.csv") {

  xdf <- read.csv(url)
  
  assign("xdf", xdf, envir = .GlobalEnv)
  
  xdf |> 
    distinct(
      month = sprintf("%s %s", month(day), year(day))
    ) |> 
    pull(month) -> months

  assign("available_months", months, envir = .GlobalEnv)
  
}

get_data_for_month_year <- \(month_year) {
  
  strsplit(month_year, " ")[[1]] |> 
    setNames(c("month", "year")) |> 
    as.list() -> my
  
  xdf |> 
    filter(
      month(day) == my$month,
      year(day) == my$year
    ) -> xdf_filtered
  
  xdf_filtered |> 
    count(source, wt=visits) |> 
		two_col_df_to_named_list() -> totals
  
  xdf_filtered |> 
    count(day, wt=visits) |> 
    arrange(day) -> daily
  
  blanks <- rep("", nrow(daily))
  vals <- daily$n
  
  list(
    totals = totals,
    xblanks = blanks,
    yvals = vals
  )  
  
}


