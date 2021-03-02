package builtins_time

parsed_date = time.parse_rfc3339_ns("2021-02-28T09:36:18Z")

add_day = time.add_date(parsed_date, 0, 0, 1)

add_month = time.add_date(parsed_date, 0, 1, 0)

add_year = time.add_date(parsed_date, 1, 0, 0)

payload = {"parsedDate": parsed_date, "addDay": add_day, "addMonth": add_month, "addYear": add_year}
