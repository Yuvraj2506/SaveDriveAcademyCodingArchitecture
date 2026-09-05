# Coding Rules

## General

- (e.g. Use as much code splitting, into components or controller as you can, the code space must be neat and clean).
- (e.g. Always use singleton pattern when possible).
- *Pre-Coding Clarification Rule*: Before writing any code, if any requirement, specification, or constraint is unclear, ambiguous, or difficult to implement safely, you MUST stop and ask the user everything needed to clarify and confirm decisions.
- *Strict PascalCase Naming Rule*: All filenames, class names, interface names, method/property names, DTO fields, and JSON serialization keys (including response envelope fields StatusCode, Success, Message, Data, Errors, Timestamp) MUST strictly use PascalCase.

  csharp
  // Definition
  public sealed class Singleton
  {
      private static readonly Singleton _current = new Singleton();
      public static Singleton Current => _current;

      private Singleton()
      {
      }

      public void SayHello()
      {
          // Something here
      }
  }

  // Usage
  Singleton.Current.SayHello();
  

- Everything should be fully typed:
  csharp
  string name = "Jett";
  int age = 25;
  double height = 6.1;
  float weight = 90.5f;
  bool isActive = true;
  char grade = 'A';
  decimal price = 99.99m;
  long population = 1_000_000L;
  

---

## File Structure

- All enums, structs, interfaces, and classes used for data transfer, state options, or data representations must be stored in the Features/${folderName}/Models/ folder inside each feature, and the file name should be in PascalCase.
- Every feature folder must follow this standardized layout (e.g., if the feature is Authentication):
    - *Controller*: Features/Authentication/AuthenticationController.cs
    - *Service Folder*: Features/Authentication/Services/AuthenticationService.cs
    - *Assertion Folder*: Features/Authentication/Assertion/AuthenticationAssertion.cs
    - *Constants Folder*: Features/Authentication/Constants/
    - *Models Folder*: Features/Authentication/Models/
    - *Utils Folder*: Features/Authentication/Utilities/

- If a file/class/utility/tool is used across more than one feature, place it in the appropriate global folder:
    - *Global Service Folder*: Service/
        - All file names must be PascalCase and end with *Service.cs.
    - *Global Constants Folder*: Constants/
        - All file names must be PascalCase and end with *Constant.java.
    - *Global Models Folder*: Models/
        - *Global Interface Folder*: Models/Interfaces/*Interface.cs
        - *Global Types Folder*: Models/Types/*Type.cs
        - *Global DTOs Folder*: Models/DTOs/*DTO.cs
        - *Global Classes Folder*: Models/Classes/*Class.cs
        - *Global Records Folder*: Models/Records/*Record.cs
    - *Global Utils Folder*: Utilities/*Utility.java (All utility classes must follow the singleton pattern with getCurrent()).
    - *Global Middlewares Folder*: Middlewares/*Middleware.cs
    - *Global Helper Folder*: Helpers/*Helper.cs (All helper classes must follow the singleton pattern).
    - *Global Exceptions Folder*: Exceptions/*CException.cs (Custom exceptions).
    - *Global Validators Folder*: Validators/*CValidator.cs (custom) or *SValidator.cs (system).
        - Each validator class must be a singleton with a single bool Validate(...) method returning true or false.
        - Each validation class must perform only one type of validation.

---

## Assertion Pattern & Controller Request Validation

- Controllers must use try-catch blocks on every endpoint, returning structured APIResponseClass<T> envelopes for all success and error paths.
- *Do not write direct if (request == null) boilerplate in controllers.* Instead, use the Feature Assertion Singleton class.
- *File Name*: ${FeatureName}Assertion.cs (e.g. AuthenticationAssertion.cs, AssetInventoryAssertion.cs)
- *File Location*: Features/${FeatureName}/Assertion/${FeatureName}Assertion.cs
- *Pattern*: Singleton class with Current instance.

### Assertion Definition:

csharp
namespace AssetsphereOrchestratorServiceLayerMSC.Features.Authentication.Assertion;

public sealed class AuthenticationAssertion
{
    private static readonly AuthenticationAssertion _current = new AuthenticationAssertion();
    public static AuthenticationAssertion Current => _current;

    private AuthenticationAssertion()
    {
    }

    public void CheckForNullRequest<T>(T? request, string errorMessage = "Request body cannot be empty.")
    {
        if (request is null)
        {
            throw new ValidationCException(errorMessage);
        }
    }

    public void AssertLoginRequest(LoginRequestDTO? request)
    {
        CheckForNullRequest(request, "Login request body cannot be empty.");

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationCException(new List<string>
            {
                "Both email and password must be provided."
            });
        }
    }
}


### Controller Usage:

csharp
[HttpPost(ApplicationRouteFactory.AuthenticationRoutes.Login)]
[AllowAnonymous]
public async Task<ActionResult<ApiResponseClass<AuthResponseDTO>>> Login([FromBody] LoginRequestDTO? request)
{
    try
    {
        AuthenticationAssertion.Current.CheckForNullRequest(request);
        AuthenticationAssertion.Current.AssertLoginRequest(request);

        AuthResponseDTO response = await _authenticationService.LoginAsync(request);
        return Ok(ApiResponseClass<AuthResponseDTO>.Succeeded(response, "Login successful.", 200));
    }
    catch (ValidationCException valEx)
    {
        _logger.LogWarning("Login validation failed: {Message}", valEx.Message);
        return BadRequest(ApiResponseClass<AuthResponseDTO>.Failed(valEx.Message, valEx.ValidationErrors, 400));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Unexpected error during login.");
        return StatusCode(500, ApiResponseClass<AuthResponseDTO>.Failed(
            "An unexpected error occurred while processing the login request.",
            new List<string> { ex.Message },
            500
        ));
    }
}


---

## Strict Route Factory Rules

- Never hardcode route strings in controllers.
- All controller route endpoints must reference the singleton ApplicationRouteFactory.cs located in Factories/.

csharp
// Wrong
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
    }
}

// Right
[ApiController]
[Route(ApplicationRouteFactory.AuthenticationRoutes.ControllerURL)]
public class AuthenticationController : ControllerBase
{
    [HttpPost(ApplicationRouteFactory.AuthenticationRoutes.Login)]
    public IActionResult Login([FromBody] LoginRequest request)
    {
    }
}

---

## Environment Variables & ENValidatorUtility Rule

- All secrets, configurations, connection strings, ports, and environment-dependent variables MUST be stored in the environment configuration (`.env`).
- Never access `process.env` directly throughout the application codebase.
- All environment variables must be retrieved and validated exclusively through the singleton `ENValidatorUtility` located in the global `Utilities/` folder.
- `ENValidatorUtility` must follow the Singleton pattern with `ENValidatorUtility.Current`.
- `ENValidatorUtility` must validate all required environment variables on startup and throw `ConfigurationCException` if any required environment variable is missing or invalid.