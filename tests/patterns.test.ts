import { describe, it, expect } from "vitest";
import {
  scanForbiddenContent,
  hasForbiddenContent,
  isExecutableOrArchiveUrl,
  FORBIDDEN_NODE_TYPES,
} from "@/lib/marketplace/validation/patterns";

/** Helper: the set of issue codes produced for a given text. */
function codesFor(text: string): string[] {
  return scanForbiddenContent(text).map((i) => i.code);
}

describe("scanForbiddenContent", () => {
  it("returns no issues for clean, human-readable text", () => {
    expect(scanForbiddenContent("Summarize my unread emails each morning.")).toEqual(
      [],
    );
    expect(
      scanForbiddenContent("A friendly workflow that drafts polite replies."),
    ).toEqual([]);
  });

  it("returns no issues for empty or non-string input", () => {
    expect(scanForbiddenContent("")).toEqual([]);
    // @ts-expect-error testing runtime guard against non-string
    expect(scanForbiddenContent(null)).toEqual([]);
    // @ts-expect-error testing runtime guard against non-string
    expect(scanForbiddenContent(undefined)).toEqual([]);
  });

  it("always marks issues as errors and carries the supplied path", () => {
    const issues = scanForbiddenContent("import os", "node-1.label");
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(issue.severity).toBe("error");
      expect(issue.path).toBe("node-1.label");
      expect(typeof issue.code).toBe("string");
      expect(typeof issue.message).toBe("string");
    }
  });

  it("is case-insensitive", () => {
    expect(codesFor("IMPORT OS")).toContain("forbidden.python");
    expect(codesFor("Document.Cookie")).toContain("forbidden.cookie");
  });

  // --- Python ---------------------------------------------------------------
  it("catches Python code", () => {
    expect(codesFor("import os")).toContain("forbidden.python");
    expect(codesFor("def run(x):")).toContain("forbidden.python");
    expect(codesFor("__import__('os')")).toContain("forbidden.python");
    expect(codesFor("os.system('ls')")).toContain("forbidden.python");
    expect(codesFor("import subprocess")).toContain("forbidden.python");
    expect(codesFor("eval('1+1')")).toContain("forbidden.python");
    expect(codesFor("exec('x=1')")).toContain("forbidden.python");
  });

  // --- JavaScript -----------------------------------------------------------
  it("catches JavaScript / code", () => {
    expect(codesFor("function(){ return 1 }")).toContain("forbidden.javascript");
    expect(codesFor("const f = () => 2")).toContain("forbidden.javascript");
    expect(codesFor("require('fs')")).toContain("forbidden.javascript");
    expect(codesFor("read process.env.SECRET")).toContain("forbidden.javascript");
    expect(codesFor("const cp = require('child_process')")).toContain(
      "forbidden.javascript",
    );
    expect(codesFor("<script>alert(1)</script>")).toContain("forbidden.javascript");
  });

  // --- Shell ----------------------------------------------------------------
  it("catches shell commands", () => {
    expect(codesFor("rm -rf /")).toContain("forbidden.shell");
    expect(codesFor("curl http://evil")).toContain("forbidden.shell");
    expect(codesFor("wget http://evil")).toContain("forbidden.shell");
    expect(codesFor("bash script.txt")).toContain("forbidden.shell");
    expect(codesFor("run powershell now")).toContain("forbidden.shell");
    expect(codesFor("cmd.exe /c dir")).toContain("forbidden.shell");
    expect(codesFor("a && b")).toContain("forbidden.shell");
    expect(codesFor("cat x | grep y")).toContain("forbidden.shell");
    expect(codesFor("x ;rm y")).toContain("forbidden.shell");
  });

  // --- Secrets --------------------------------------------------------------
  it("catches secrets, keys and credentials", () => {
    expect(codesFor("sk-ABCDEFGH12345678")).toContain("forbidden.secret");
    expect(codesFor("my api_key is here")).toContain("forbidden.secret");
    expect(codesFor("API-KEY: xyz")).toContain("forbidden.secret");
    expect(codesFor("this is a secret value")).toContain("forbidden.secret");
    expect(codesFor("password: hunter2")).toContain("forbidden.secret");
    expect(codesFor("access token included")).toContain("forbidden.secret");
    expect(codesFor("Authorization: bearer abc.def")).toContain("forbidden.secret");
    expect(codesFor("AKIAIOSFODNN7EXAMPLE")).toContain("forbidden.secret");
    expect(
      codesFor("-----BEGIN PRIVATE KEY-----\nMIIB...\n-----END PRIVATE KEY-----"),
    ).toContain("forbidden.secret");
    expect(
      codesFor("-----BEGIN RSA PRIVATE KEY-----\nMIIB...\n"),
    ).toContain("forbidden.secret");
  });

  // --- Cookies --------------------------------------------------------------
  it("catches browser cookies / session material", () => {
    expect(codesFor("document.cookie")).toContain("forbidden.cookie");
    expect(codesFor("Cookie: a=b")).toContain("forbidden.cookie");
    expect(codesFor("session=abc123")).toContain("forbidden.cookie");
    expect(codesFor("set the sessionid value")).toContain("forbidden.cookie");
  });

  // --- .env -----------------------------------------------------------------
  it("catches .env / dotenv references", () => {
    expect(codesFor("read from .env file")).toContain("forbidden.dotenv");
    expect(codesFor("load dotenv config")).toContain("forbidden.dotenv");
  });

  // --- Local paths ----------------------------------------------------------
  it("catches local file paths", () => {
    expect(codesFor("C:\\Users\\me\\secret.txt")).toContain("forbidden.local_path");
    expect(codesFor("\\\\server\\share")).toContain("forbidden.local_path");
    expect(codesFor("/home/alice/data")).toContain("forbidden.local_path");
    expect(codesFor("/Users/bob/notes")).toContain("forbidden.local_path");
    expect(codesFor("/etc/passwd")).toContain("forbidden.local_path");
    expect(codesFor("file:///tmp/x")).toContain("forbidden.local_path");
  });

  // --- Executables / archives ----------------------------------------------
  it("catches executable / archive URLs and paths", () => {
    expect(codesFor("https://x.com/tool.exe")).toContain("forbidden.executable");
    expect(codesFor("https://x.com/lib.dll")).toContain("forbidden.executable");
    expect(codesFor("https://x.com/run.sh")).toContain("forbidden.executable");
    expect(codesFor("https://x.com/run.bat")).toContain("forbidden.executable");
    expect(codesFor("https://x.com/run.ps1")).toContain("forbidden.executable");
    expect(codesFor("https://x.com/pack.zip")).toContain("forbidden.executable");
    expect(codesFor("https://x.com/setup.msi")).toContain("forbidden.executable");
    expect(codesFor("https://x.com/app.apk")).toContain("forbidden.executable");
    expect(codesFor("https://x.com/app.dmg")).toContain("forbidden.executable");
    expect(codesFor("https://x.com/pack.zip?v=2")).toContain("forbidden.executable");
  });

  it("does not flag a normal https documentation URL", () => {
    expect(scanForbiddenContent("https://example.com/docs/getting-started")).toEqual(
      [],
    );
  });

  it("de-duplicates a category to a single issue", () => {
    const issues = scanForbiddenContent("import os; import sys");
    const python = issues.filter((i) => i.code === "forbidden.python");
    expect(python.length).toBe(1);
  });

  it("reports multiple distinct categories at once", () => {
    const codes = codesFor("import os && curl http://x/tool.exe");
    expect(codes).toContain("forbidden.python");
    expect(codes).toContain("forbidden.shell");
    expect(codes).toContain("forbidden.executable");
  });
});

describe("hasForbiddenContent", () => {
  it("is true when forbidden, false when clean", () => {
    expect(hasForbiddenContent("import os")).toBe(true);
    expect(hasForbiddenContent("Just a clean label")).toBe(false);
  });
});

describe("isExecutableOrArchiveUrl", () => {
  it("detects executable/archive URLs", () => {
    expect(isExecutableOrArchiveUrl("https://x.com/a.exe")).toBe(true);
    expect(isExecutableOrArchiveUrl("https://x.com/a.zip")).toBe(true);
  });
  it("returns false for safe URLs", () => {
    expect(isExecutableOrArchiveUrl("https://x.com/docs")).toBe(false);
    expect(isExecutableOrArchiveUrl("https://x.com/page.html")).toBe(false);
  });
});

describe("FORBIDDEN_NODE_TYPES", () => {
  it("documents code-execution shaped node kinds", () => {
    expect(FORBIDDEN_NODE_TYPES).toContain("code");
    expect(FORBIDDEN_NODE_TYPES).toContain("shell");
    expect(FORBIDDEN_NODE_TYPES).toContain("eval");
  });
});
