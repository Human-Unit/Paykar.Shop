from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

Color = Annotated[str, Field(pattern=r"^#[0-9a-fA-F]{6}$")]
Scale = Annotated[float, Field(ge=0.85, le=1.2, allow_inf_nan=False)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Palette(StrictModel):
    background: Color
    surface: Color
    raised: Color
    text: Color
    muted: Color
    border: Color
    border_opacity: float = Field(ge=0.04, le=1, allow_inf_nan=False)


class Colors(StrictModel):
    brand: Color = "#00a82d"
    sale: Color = "#ff0000"
    dark: Palette = Palette(
        background="#080808",
        surface="#111111",
        raised="#161616",
        text="#f5f5f5",
        muted="#a3a3a3",
        border="#ffffff",
        border_opacity=0.08,
    )
    light: Palette = Palette(
        background="#f7f8f5",
        surface="#ffffff",
        raised="#f1f3ef",
        text="#181818",
        muted="#646b65",
        border="#e3e6e1",
        border_opacity=1,
    )


class Typography(StrictModel):
    heading_scale: Scale = 1
    body_scale: Scale = 1


class Layout(StrictModel):
    content_width: int = Field(default=1320, ge=960, le=1600)
    page_padding: int = Field(default=32, ge=20, le=64)
    section_spacing: int = Field(default=72, ge=40, le=96)


class Shape(StrictModel):
    button: int = Field(default=12, ge=4, le=24)
    card: int = Field(default=18, ge=8, le=32)
    panel: int = Field(default=24, ge=12, le=40)


class Effects(StrictModel):
    glass_blur: int = Field(default=14, ge=0, le=20)
    glass_opacity: float = Field(default=0.78, ge=0.6, le=1, allow_inf_nan=False)
    glow_intensity: float = Field(default=1, ge=0, le=1.25, allow_inf_nan=False)
    shadow_intensity: float = Field(default=1, ge=0, le=1.25, allow_inf_nan=False)
    watermark_opacity: float = Field(default=0.09, ge=0, le=0.12, allow_inf_nan=False)


class Motion(StrictModel):
    intensity: float = Field(default=1, ge=0, le=1, allow_inf_nan=False)
    hover_lift: float = Field(default=0, ge=0, le=5, allow_inf_nan=False)
    duration_scale: float = Field(default=1, ge=0.7, le=1.3, allow_inf_nan=False)


class PaykarDesign(StrictModel):
    colors: Colors = Field(default_factory=Colors)
    typography: Typography = Field(default_factory=Typography)
    layout: Layout = Field(default_factory=Layout)
    radius: Shape = Field(default_factory=Shape)
    effects: Effects = Field(default_factory=Effects)
    motion: Motion = Field(default_factory=Motion)
