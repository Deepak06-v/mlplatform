from pydantic import BaseModel,Field,computed_field
from typing import Annotated,Literal

class InputData(BaseModel):
    age: Annotated[int, Field(..., gt=0, description='Age of the person')]
    bmi: Annotated[float, Field(..., description='BMI of the person')]
    children: Annotated[int, Field(..., description="Number of children (0 if none)")]
    smoker: Annotated[Literal['yes','no'], Field(..., description="Smoker or not")]
    sex: Annotated[Literal['male','female'], Field(..., description='Gender of the person')]
    region: Annotated[Literal['southeast','southwest','northwest','northeast'], Field(...)]

    @computed_field
    @property
    def bmi_smoker(self) -> float:
        # Fixed logic: BMI * 1 if smoker, else 0
        multiplier = 1 if self.smoker == 'yes' else 0
        return float(self.bmi * multiplier)
