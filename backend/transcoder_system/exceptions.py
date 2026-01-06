from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError


def custom_exception_handler(exception, context):
    # Let DRF create the default error response
    response = exception_handler(exception, context)

    # Only customize validation errors
    if not isinstance(exception, ValidationError) or response is None:
        return response

    custom_response = {
        "status": "error",
        "code": response.status_code,
        "error": []
    }

    errors = response.data

    for field, message in errors.items():

        # Simple string error
        if isinstance(message, str):
            custom_response["error"].append({
                "fields": field,
                "message": message
            })

        # List of string errors
        elif isinstance(message, list) and message and isinstance(message[0], str):
            for msg in message:
                custom_response["error"].append({
                    "fields": field,
                    "message": msg
                })

        # Nested list errors (ABR profiles)
        elif isinstance(message, list) and message and isinstance(message[0], dict):
            for index, item in enumerate(message):
                for sub_field, sub_messages in item.items():
                    for sub_msg in sub_messages:
                        custom_response["error"].append({
                            "fields": f"{field}[{index}].{sub_field}",
                            "message": sub_msg
                        })

        # Nested dict errors
        elif isinstance(message, dict):
            for sub_field, sub_messages in message.items():
                for sub_msg in sub_messages:
                    custom_response["error"].append({
                        "fields": f"{field}.{sub_field}",
                        "message": sub_msg
                    })

        # Fallback
        else:
            custom_response["error"].append({
                "fields": field,
                "message": str(message)
            })

    return Response(custom_response, response.status_code)
