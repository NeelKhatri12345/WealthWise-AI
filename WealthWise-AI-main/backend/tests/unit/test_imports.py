"""Smoke tests verifying the backend package is importable.

These tests do not exercise behavior — they exist so CI can prove that
`pytest` can resolve the `app` package from the configured pythonpath.
Real unit tests will replace this file as the test suite grows.
"""


def test_app_package_importable() -> None:
    import app  # noqa: F401


def test_config_module_importable() -> None:
    from app.core import config  # noqa: F401


def test_security_module_importable() -> None:
    from app.core import security  # noqa: F401


def test_schemas_module_importable() -> None:
    from app.schemas import base_schema  # noqa: F401
