month <- \(x, abb=TRUE) { 
  m <- as.POSIXlt(x)$mon + 1
  if (abb[1]) month.abb[m] else month.name[m]
}

year <- \(x) { as.POSIXlt(x)$year + 1900 }

two_col_df_to_named_list <- \(df) {
  with(df, tapply(visits, source, FUN=I)) |> 
    as.list()
}

setup_data <- \(url = "https://rud.is/webr-dash/subs.csv") {
  
  xdf <- read.csv(url)
  
  assign("xdf", xdf, envir = .GlobalEnv)
  
  sprintf("%s %s", month(xdf$day), year(xdf$day)) |> 
    unique() -> months
  
  assign("available_months", months, envir = .GlobalEnv)
  
}

get_data_for_month_year <- \(month_year) {
  
  strsplit(month_year, " ")[[1]] |> 
    setNames(c("month", "year")) |> 
    as.list() -> my
  
  xdf_filtered <- subset(xdf, month(day) == my$month & year(day) == my$year)

  totals <- aggregate(visits ~ source, xdf_filtered, \(.x) c(n = sum(.x)))
  totals <- two_col_df_to_named_list(totals)

  daily <- aggregate(visits ~ day, xdf_filtered, \(.x) c(n = sum(.x)))
  daily <- daily[order(daily$day),]
  
  blanks <- rep("", nrow(daily))
  vals <- daily$visits
  
  list(
    totals = totals,
    xblanks = blanks,
    yvals = vals
  )  
  
}