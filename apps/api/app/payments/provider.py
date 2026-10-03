from dataclasses import dataclass
from typing import Literal, Protocol

Scenario = Literal["SUCCESS", "DECLINED", "INSUFFICIENT", "ERROR"]


@dataclass(frozen=True)
class Decision:
    succeeded: bool
    reason: str | None = None


class PaymentProvider(Protocol):
    def confirm(self, scenario: Scenario) -> Decision: ...


class SandboxPaymentProvider:
    """Deterministic synthetic commands only; never contacts a bank."""

    def confirm(self, scenario: Scenario) -> Decision:
        return {
            "SUCCESS": Decision(True),
            "DECLINED": Decision(False, "declined"),
            "INSUFFICIENT": Decision(False, "insufficient_funds"),
            "ERROR": Decision(False, "processing_error"),
        }[scenario]
