import pytest
from pydantic import ValidationError

from app.schemas.design import PaykarDesign


@pytest.mark.parametrize(
    "scope,tokens",
    [
        ({"sections": {"home.hero": {}}}, {"colors.brand": "#224433"}),
        ({"pages": {"home": {}}}, {"layout.page_padding": 42}),
    ],
)
def test_scoped_design_compatible(scope, tokens):
    kind = next(iter(scope))
    key = next(iter(scope[kind]))
    scope[kind][key] = tokens
    config = PaykarDesign.model_validate(scope)
    assert config.colors.brand == "#00a82d"
    assert config.model_dump()[kind][key] == tokens
    assert PaykarDesign.model_validate({}).pages == {}


@pytest.mark.parametrize(
    "overrides",
    [
        {"pages": {"unknown": {}}},
        {"sections": {"arbitrary": {}}},
        {"sections": {"home.hero": {"layout.content_width": 1200}}},
        {"pages": {"home": {"colors.brand": "red;display:none"}}},
        {"pages": {"home": {"radius.card": 200}}},
        {"pages": {"home": {"effects.glow_intensity": True}}},
        {"pages": {"home": {"layout.page_padding": "40"}}},
        {"pages": {"home": {"colors.dark.surface": 12}}},
        {"pages": {"home": {"radius.card": 12.5}}},
        {"sections": {"home.hero": {"__proto__.color": "#ffffff"}}},
    ],
)
def test_unsafe_scoped_config_rejected(overrides):
    with pytest.raises(ValidationError):
        PaykarDesign.model_validate(overrides)
