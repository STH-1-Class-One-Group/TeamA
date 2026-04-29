class RepositoryError(ValueError):
    """Base repository contract error."""


class RepositoryNotFoundError(RepositoryError):
    """Raised when a requested entity is not present."""


class RepositoryValidationError(RepositoryError):
    """Raised when repository input or identifier validation fails."""


class RepositoryPermissionError(RepositoryError):
    """Raised when the caller cannot perform the requested repository action."""
