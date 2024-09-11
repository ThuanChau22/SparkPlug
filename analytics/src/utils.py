# Sanitize input
def sanitize_input(input_string):
    """
    Sanitizes the input string by escaping potentially dangerous characters
    and removing newline characters.
    :param input_string: The string to be sanitized.
    :return: Sanitized string.
    """
    if not isinstance(input_string, str):
        return input_string

    sanitized_string = input_string.replace("\n", "").replace("\r", "")
    sanitized_string = sanitized_string.replace("'", "\\'").replace('"', '\\"')

    return sanitized_string