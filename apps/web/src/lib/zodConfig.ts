import { z } from "zod";

// Zod tests whether it can compile code with Function(), and the content security policy logs a violation for that test.
// Without the test, Zod uses its normal checks. Zod runs the test for the first schema it builds, so import this module first.
z.config({ jitless: true });
