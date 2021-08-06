use casper_types::ApiError;

#[repr(u16)]
pub enum Error {
    UnknownApiCommand = 1,
    PermissionDenied = 2,
    ThresholdViolation = 3,
    MaxKeysLimit = 4,
    DuplicateKey = 5,
    KeyManagementThreshold = 6,
    DeploymentThreshold = 7,
    InsufficientTotalWeight = 8,
    MissingArgument0 = 20,
    MissingArgument1 = 21,
    MissingArgument2 = 22,
    InvalidArgument0 = 23,
    InvalidArgument1 = 24,
    InvalidArgument2 = 25,
    UnsupportedNumberOfArguments = 30,
}

impl Error {
    pub fn missing_argument(i: u32) -> Error {
        match i {
            0 => Error::MissingArgument0,
            1 => Error::MissingArgument1,
            2 => Error::MissingArgument2,
            _ => Error::UnsupportedNumberOfArguments,
        }
    }

    pub fn invalid_argument(i: u32) -> Error {
        match i {
            0 => Error::InvalidArgument0,
            1 => Error::InvalidArgument1,
            2 => Error::InvalidArgument2,
            _ => Error::UnsupportedNumberOfArguments,
        }
    }
}

impl From<Error> for ApiError {
    fn from(error: Error) -> ApiError {
        ApiError::User(error as u16)
    }
}
