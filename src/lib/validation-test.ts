import { ContentSanitizer, commonSchemas, authSchemas, userSchemas, contentSchemas } from "./validation";

// Test suite for validation and sanitization
export class ValidationTests {
  // Test XSS prevention
  static testXssPrevention() {
    console.log("Testing XSS Prevention...");
    
    const xssAttempts = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(\'xss\')">',
      'javascript:alert("xss")',
      '<div onclick="alert(\'xss\')">Click me</div>',
      'data:text/html,<script>alert("xss")</script>',
      'vbscript:msgbox("xss")',
      '<iframe src="javascript:alert(\'xss\')"></iframe>',
      '<object data="javascript:alert(\'xss\')"></object>',
      '<embed src="javascript:alert(\'xss\')">',
      '<link rel="stylesheet" href="javascript:alert(\'xss\')">',
      '<style>@import "javascript:alert(\'xss\')";</style>',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'xss\')">',
    ];

    xssAttempts.forEach((xss, index) => {
      const sanitized = ContentSanitizer.sanitizeHtml(xss);
      const containsScript = sanitized.includes('<script>') || sanitized.includes('javascript:');
      console.log(`Test ${index + 1}: ${containsScript ? 'FAILED' : 'PASSED'}`);
      console.log(`  Input: ${xss}`);
      console.log(`  Output: ${sanitized}`);
      console.log('');
    });
  }

  // Test SQL injection prevention
  static testSqlInjectionPrevention() {
    console.log("Testing SQL Injection Prevention...");
    
    const sqlAttempts = [
      "'; DROP TABLE users; --",
      "OR '1'='1'",
      "1 UNION SELECT * FROM users",
      "'; INSERT INTO users VALUES('hacker','pass'); --",
      "1; DELETE FROM users WHERE 1=1; --",
      "'; EXEC xp_cmdshell('dir'); --",
      "1' OR '1'='1' --",
      "admin' --",
      "' OR 1=1#",
      "' OR 'a'='a",
    ];

    sqlAttempts.forEach((sql, index) => {
      const containsInjection = sql.includes("'") && (
        sql.includes('SELECT') || 
        sql.includes('DROP') || 
        sql.includes('INSERT') || 
        sql.includes('DELETE') || 
        sql.includes('UPDATE') || 
        sql.includes('UNION') ||
        sql.includes('EXEC') ||
        sql.includes('--') ||
        sql.includes('OR')
      );
      
      console.log(`Test ${index + 1}: ${containsInjection ? 'DETECTED' : 'NOT DETECTED'}`);
      console.log(`  Input: ${sql}`);
      console.log('');
    });
  }

  // Test email validation
  static testEmailValidation() {
    console.log("Testing Email Validation...");
    
    const testEmails = [
      { email: 'valid@example.com', valid: true },
      { email: 'user.name+tag@domain.co.uk', valid: true },
      { email: 'user@sub.domain.com', valid: true },
      { email: 'invalid-email', valid: false },
      { email: '@domain.com', valid: false },
      { email: 'user@', valid: false },
      { email: 'user..name@domain.com', valid: false },
      { email: 'user@domain..com', valid: false },
      { email: 'user@domain.c', valid: false },
      { email: '', valid: false },
      { email: '<script>alert("xss")</script>@domain.com', valid: false },
    ];

    testEmails.forEach(({ email, valid }, index) => {
      try {
        authSchemas.signUp.parse({ name: 'Test', email, password: 'ValidPass123' });
        console.log(`Test ${index + 1}: ${valid ? 'PASSED' : 'FAILED'} - ${email}`);
      } catch (error) {
        console.log(`Test ${index + 1}: ${!valid ? 'PASSED' : 'FAILED'} - ${email}`);
      }
    });
  }

  // Test password validation
  static testPasswordValidation() {
    console.log("Testing Password Validation...");
    
    const testPasswords = [
      { password: 'ValidPass123', valid: true },
      { password: 'validpass123', valid: false }, // Missing uppercase
      { password: 'VALIDPASS123', valid: false }, // Missing lowercase
      { password: 'ValidPass', valid: false }, // Missing number
      { password: '123', valid: false }, // Too short
      { password: 'ValidPass123<script>', valid: false }, // Contains HTML
      { password: 'ValidPass123 ', valid: false }, // Contains space
      { password: 'ValidPass123'.repeat(10), valid: false }, // Too long
    ];

    testPasswords.forEach(({ password, valid }, index) => {
      try {
        authSchemas.signUp.parse({ name: 'Test', email: 'test@example.com', password });
        console.log(`Test ${index + 1}: ${valid ? 'PASSED' : 'FAILED'} - ${password}`);
      } catch (error) {
        console.log(`Test ${index + 1}: ${!valid ? 'PASSED' : 'FAILED'} - ${password}`);
      }
    });
  }

  // Test text sanitization
  static testTextSanitization() {
    console.log("Testing Text Sanitization...");
    
    const testTexts = [
      'Normal text content',
      'Text with <strong>HTML</strong> tags',
      'Text with <script>alert("xss")</script> malicious content',
      'Text with javascript:alert("xss") protocol',
      'Text with onclick="alert(\'xss\')" event handler',
      'Text with control characters\x00\x1F',
      'Text with unicode: ñáéíóú',
      'Text with emoji: 😀🎉🚀',
    ];

    testTexts.forEach((text, index) => {
      const sanitized = ContentSanitizer.sanitizeText(text);
      const hasXss = sanitized.includes('<script>') || sanitized.includes('javascript:') || sanitized.includes('onclick=');
      
      console.log(`Test ${index + 1}: ${hasXss ? 'FAILED' : 'PASSED'}`);
      console.log(`  Input: ${text}`);
      console.log(`  Output: ${sanitized}`);
      console.log('');
    });
  }

  // Test URL validation
  static testUrlValidation() {
    console.log("Testing URL Validation...");
    
    const testUrls = [
      { url: 'https://example.com', valid: true },
      { url: 'http://sub.domain.com/path', valid: true },
      { url: 'javascript:alert("xss")', valid: false },
      { url: 'data:text/html,<script>alert("xss")</script>', valid: false },
      { url: 'vbscript:msgbox("xss")', valid: false },
      { url: 'not-a-url', valid: false },
      { url: '', valid: true }, // Empty should be valid for optional fields
      { url: 'ftp://example.com', valid: false }, // Only HTTP/HTTPS allowed
    ];

    testUrls.forEach(({ url, valid }, index) => {
      const sanitized = ContentSanitizer.sanitizeUrl(url);
      const isValid = (sanitized.length > 0) === (valid && url.length > 0);
      
      console.log(`Test ${index + 1}: ${isValid ? 'PASSED' : 'FAILED'} - ${url}`);
      console.log(`  Output: ${sanitized}`);
      console.log('');
    });
  }

  // Test filename sanitization
  static testFilenameSanitization() {
    console.log("Testing Filename Sanitization...");
    
    const testFilenames = [
      'normal-file.txt',
      'file with spaces.pdf',
      'file-with-dashes.doc',
      'file_with_underscores.jpg',
      'file<script>alert("xss")</script>.png', // Contains XSS
      '../../../etc/passwd', // Path traversal
      'con.txt', // Reserved name (Windows)
      'file|pipe.txt', // Invalid character
      'file"quote.txt', // Invalid character
      'file:colon.txt', // Invalid character
      'file?question.txt', // Invalid character
      'file*asterisk.txt', // Invalid character
      'a'.repeat(300) + '.txt', // Too long
    ];

    testFilenames.forEach((filename, index) => {
      const sanitized = ContentSanitizer.sanitizeFilename(filename);
      const hasInvalidChars = /[^a-zA-Z0-9.-]/.test(sanitized);
      const isTooLong = sanitized.length > 255;
      
      console.log(`Test ${index + 1}: ${!hasInvalidChars && !isTooLong ? 'PASSED' : 'FAILED'}`);
      console.log(`  Input: ${filename}`);
      console.log(`  Output: ${sanitized}`);
      console.log('');
    });
  }

  // Test content validation for blog posts
  static testBlogPostValidation() {
    console.log("Testing Blog Post Validation...");
    
    const testPosts = [
      {
        title: 'Valid Blog Post',
        content: '<p>This is valid content with <strong>HTML</strong> tags.</p>',
        valid: true,
      },
      {
        title: 'Post with XSS',
        content: '<p>Content with <script>alert("xss")</script> malicious script.</p>',
        valid: false,
      },
      {
        title: '', // Empty title
        content: '<p>Valid content</p>',
        valid: false,
      },
      {
        title: 'A'.repeat(200), // Title too long
        content: '<p>Valid content</p>',
        valid: false,
      },
      {
        title: 'Valid Title',
        content: '', // Empty content
        valid: false,
      },
    ];

    testPosts.forEach(({ title, content, valid }, index) => {
      try {
        contentSchemas.blogPost.parse({ title, content });
        console.log(`Test ${index + 1}: ${valid ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        console.log(`Test ${index + 1}: ${!valid ? 'PASSED' : 'FAILED'}`);
      }
      console.log(`  Title: ${title}`);
      console.log(`  Content: ${content.substring(0, 50)}...`);
      console.log('');
    });
  }

  // Run all tests
  static runAllTests() {
    console.log("=== Running Validation Tests ===\n");
    
    this.testXssPrevention();
    console.log("\n" + "=".repeat(50) + "\n");
    
    this.testSqlInjectionPrevention();
    console.log("\n" + "=".repeat(50) + "\n");
    
    this.testEmailValidation();
    console.log("\n" + "=".repeat(50) + "\n");
    
    this.testPasswordValidation();
    console.log("\n" + "=".repeat(50) + "\n");
    
    this.testTextSanitization();
    console.log("\n" + "=".repeat(50) + "\n");
    
    this.testUrlValidation();
    console.log("\n" + "=".repeat(50) + "\n");
    
    this.testFilenameSanitization();
    console.log("\n" + "=".repeat(50) + "\n");
    
    this.testBlogPostValidation();
    
    console.log("\n=== Validation Tests Complete ===");
  }
}

// Export for use in development/testing
export default ValidationTests;
