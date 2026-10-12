from pydantic import BaseModel, model_validator


class BlankToNone(BaseModel):
    """Treat empty form fields ("" / whitespace) as "not provided".

    HTML forms always submit "" for untouched inputs, which would otherwise fail
    validation for optional e-mail / date fields."""

    @model_validator(mode="before")
    @classmethod
    def _blank_to_none(cls, data):
        if isinstance(data, dict):
            return {k: (None if isinstance(v, str) and not v.strip() else v) for k, v in data.items()}
        return data
