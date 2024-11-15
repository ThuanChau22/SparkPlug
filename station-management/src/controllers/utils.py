import re


def is_exclude(s):
    return re.search("^-(.*)+$", s)


def extract_args_select(fields):
    select = {}
    if fields:
        for field in fields.split(","):
            if is_exclude(field):
                select[field[1:]] = 0
            else:
                select[field] = 1
    return select


def extract_args_sort_by(field):
    sort = {"created_at": 1, "id": 1}
    if field:
        is_include = not is_exclude(field)
        field = field if is_include else field[1:]
        value = 1 if is_include else -1
        if field == "id":
            sort = {field: value}
        elif field == "created_at":
            sort[field] = value
        else:
            sort = {field: value, **sort}
    return sort
