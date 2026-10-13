from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Measurement(BaseModel):
    measurement_mode: Literal["PIECE", "WEIGHT", "DUAL"] = "PIECE"
    price_unit: Literal["PIECE", "KG"] = "PIECE"
    average_piece_weight_g: int | None = Field(default=None, gt=0, le=100000, strict=True)
    quantity_step: int = Field(default=1, gt=0, le=99000, strict=True)
    minimum_quantity: int = Field(default=1, gt=0, le=99000, strict=True)

    @model_validator(mode="after")
    def measurement_rules(self):
        if self.measurement_mode == "PIECE":
            if self.price_unit != "PIECE" or self.average_piece_weight_g is not None:
                raise ValueError("Piece products require PIECE pricing and no average weight")
            if self.quantity_step != 1 or self.minimum_quantity > 99:
                raise ValueError("Piece products require step 1 and a minimum of 1-99 pieces")
        elif self.price_unit != "KG":
            raise ValueError("Weight products require KG pricing")
        elif self.measurement_mode == "DUAL" and self.average_piece_weight_g is None:
            raise ValueError("DUAL products require the average weight of one piece in grams")
        elif self.measurement_mode == "WEIGHT" and self.average_piece_weight_g is not None:
            raise ValueError("WEIGHT products do not use average piece weight")
        if self.price_unit == "KG" and self.minimum_quantity % self.quantity_step:
            raise ValueError("Weight minimum must be a multiple of the weight step")
        return self
