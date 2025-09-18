from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

def custom_exception_handler(exception, context):
    response = exception_handler(exception, context)

    if isinstance(exception, ValidationError) and response is not None:
        custom_response = {
            "status": "error",
            "code": response.status_code,
            "error": []
        }

        #Reformatting fields error to a list
        for field, message in response.data.items():
            if isinstance(message, list):
                for msg in message:
                    custom_response["error"].append({
                        "fields": field,
                        "message": msg
                    })
            else:
                custom_response["error"].append({
                    "field": field,
                    "message": message
                })
        return Response(custom_response, response.status_code)

    return response      
