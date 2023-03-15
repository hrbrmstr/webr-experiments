get_webr_packages <- function() {
  ap <- available.packages(repos = "https://repo.r-wasm.org/", type = "source")
  ap <- as.data.frame(ap)
  ap[, c("Package", "Version", "License")]
}

my_iris <- iris