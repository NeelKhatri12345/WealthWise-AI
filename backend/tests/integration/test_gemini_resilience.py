import pytest
import asyncio
from unittest.mock import MagicMock, patch
from google.genai.errors import APIError
from app.clients.gemini_client import GeminiClient
from app.exceptions.custom_exceptions import ServiceUnavailableException


@pytest.fixture
def mock_client_setup():
    """Fixture to mock Client config and return Client instance and model mock."""
    with patch("google.genai.Client") as mock_client_class:
        # Mock Client instance
        client_instance = MagicMock()
        mock_client_class.return_value = client_instance
        yield client_instance


@pytest.mark.asyncio
async def test_gemini_resilience_success_first_try(mock_client_setup):
    """Verify that a successful response is returned immediately on the first attempt."""
    client_instance = mock_client_setup

    # Mock response object
    mock_response = MagicMock()
    mock_response.text = "Hello there"
    mock_response.usage_metadata.total_token_count = 15
    client_instance.models.generate_content.return_value = mock_response

    # Initialize client
    gemini_client = GeminiClient()

    text, tokens = await gemini_client.generate(
        system_prompt="system",
        history=[],
        user_message="hello",
    )

    assert text == "Hello there"
    assert tokens == 15
    client_instance.models.generate_content.assert_called_once()


@pytest.mark.asyncio
async def test_gemini_resilience_retry_then_success(mock_client_setup):
    """Verify that a transient failure (503) triggers a retry and succeeds on attempt 2."""
    client_instance = mock_client_setup

    # Side effect: first raise 503 APIError, then succeed
    err_503 = APIError(503, {}, None)
    mock_response = MagicMock()
    mock_response.text = "Recovered answer"
    mock_response.usage_metadata.total_token_count = 20

    client_instance.models.generate_content.side_effect = [err_503, mock_response]

    gemini_client = GeminiClient()

    with patch("asyncio.sleep") as mock_sleep:
        text, tokens = await gemini_client.generate(
            system_prompt="system",
            history=[],
            user_message="hello",
        )

        assert text == "Recovered answer"
        assert tokens == 20
        assert client_instance.models.generate_content.call_count == 2
        mock_sleep.assert_called_once_with(1)  # First backoff is 1s


@pytest.mark.asyncio
async def test_gemini_resilience_503_fails_after_retries(mock_client_setup):
    """Verify that persistent 503 errors raise ServiceUnavailableException after 3 retries (4 attempts total)."""
    client_instance = mock_client_setup
    err_503 = APIError(503, {}, None)
    client_instance.models.generate_content.side_effect = err_503

    gemini_client = GeminiClient()

    with patch("asyncio.sleep") as mock_sleep:
        with pytest.raises(ServiceUnavailableException) as exc_info:
            await gemini_client.generate(
                system_prompt="system",
                history=[],
                user_message="hello",
            )

        assert "AI Coach is currently experiencing high demand" in str(exc_info.value)
        assert client_instance.models.generate_content.call_count == 4
        assert mock_sleep.call_count == 3
        mock_sleep.assert_any_call(1)
        mock_sleep.assert_any_call(2)
        mock_sleep.assert_any_call(4)


@pytest.mark.asyncio
async def test_gemini_resilience_429_rate_limit(mock_client_setup):
    """Verify that persistent 429 (Rate Limit / Too Many Requests) raises ServiceUnavailableException."""
    client_instance = mock_client_setup
    err_429 = APIError(429, {}, None)
    client_instance.models.generate_content.side_effect = err_429

    gemini_client = GeminiClient()

    with patch("asyncio.sleep") as mock_sleep:
        with pytest.raises(ServiceUnavailableException) as exc_info:
            await gemini_client.generate(
                system_prompt="system",
                history=[],
                user_message="hello",
            )

        assert "AI Coach is currently experiencing high demand" in str(exc_info.value)
        assert client_instance.models.generate_content.call_count == 4
        assert mock_sleep.call_count == 3


@pytest.mark.asyncio
async def test_gemini_resilience_timeout(mock_client_setup):
    """Verify that persistent Timeout errors raise ServiceUnavailableException."""
    client_instance = mock_client_setup
    client_instance.models.generate_content.side_effect = asyncio.TimeoutError()

    gemini_client = GeminiClient()

    with patch("asyncio.sleep") as mock_sleep:
        with pytest.raises(ServiceUnavailableException) as exc_info:
            await gemini_client.generate(
                system_prompt="system",
                history=[],
                user_message="hello",
            )

        assert "AI Coach is currently experiencing high demand" in str(exc_info.value)
        assert client_instance.models.generate_content.call_count == 4
        assert mock_sleep.call_count == 3
