import { ValidationError } from "class-validator";

class ValidationErrorDetail {
  property: string;
  constraints?: { [key: string]: string };

  constructor(property: string, constraints?: { [key: string]: string }) {
    this.property = property;
    this.constraints = constraints;
  }
}

export class ValidationErrorException extends Error {
  statusCode: number;
  validationErrors: ValidationErrorDetail[];
  data: any; // Add a data property

  constructor(validationErrors: ValidationError[], statusCode: number = 400) {
    super();
    this.statusCode = statusCode;
    this.validationErrors = validationErrors.map(
      (err) => new ValidationErrorDetail(err.property, err.constraints)
    );

    // Generate a message string
    this.message = this.validationErrors
      .map(
        (err) =>
          `${err.property}: ${Object.values(err.constraints || {}).join(", ")}`
      )
      .join("; ");

    this.name = "ValidationErrorException";
    this.data = null; // Set data to null
  }
}

export const throwValidationErrors = (
  validationErrors: ValidationError[],
  statusCode: number = 400
) => {
  throw new ValidationErrorException(validationErrors, statusCode);
};
