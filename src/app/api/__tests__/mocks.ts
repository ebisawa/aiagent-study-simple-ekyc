// Next.jsのRequestとResponseのモック
// グローバルにRequestが定義されていない場合のみ定義する
if (typeof global.Request === 'undefined') {
  // @ts-ignore
  global.Request = class MockRequest {
    url: string;
    method: string;
    headers: Headers;
    body: ReadableStream | null;
    
    constructor(input: string | URL, init?: RequestInit) {
      this.url = input instanceof URL ? input.toString() : input;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = null;
    }
    
    clone() {
      return new MockRequest(this.url, {
        method: this.method,
        headers: this.headers
      });
    }
  };
}

// グローバルにResponseが定義されていない場合のみ定義する
if (typeof global.Response === 'undefined') {
  // @ts-ignore
  global.Response = class MockResponse {
    status: number;
    statusText: string;
    headers: Headers;
    body: ReadableStream | null;
    
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.statusText = init?.statusText || '';
      this.headers = new Headers(init?.headers);
      this.body = null;
    }
    
    clone() {
      return new MockResponse(null, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      });
    }
    
    json() {
      return Promise.resolve({});
    }
  };
}

// NextRequestのモック
class MockNextRequest {
  cookies: any = {};
  nextUrl: URL;
  page: any = { name: 'test' };
  ua: any = { isBot: false };
  INTERNALS: any = {};
  url: string;
  method: string;
  headers: Headers;
  body: ReadableStream | null;

  constructor(input: string | URL, init?: RequestInit) {
    this.nextUrl = input instanceof URL ? input : new URL(input.toString());
    this.url = this.nextUrl.toString();
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = null;
  }
  
  json() {
    return Promise.resolve({});
  }
  
  text() {
    return Promise.resolve('');
  }
  
  blob() {
    return Promise.resolve(new Blob());
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  formData() {
    return Promise.resolve(new FormData());
  }
  
  clone() {
    return new MockNextRequest(this.nextUrl, {
      method: this.method,
      headers: this.headers
    });
  }
}

// NextResponseのモック
const NextResponse = {
  json: (body: any, init?: ResponseInit) => {
    const headers = new Headers(init?.headers);
    headers.set('content-type', 'application/json');
    
    const mockResponse = {
      status: init?.status || 200,
      statusText: init?.statusText || '',
      headers: headers,
      json: async () => body,
      text: async () => JSON.stringify(body),
      clone: () => ({ ...mockResponse }),
    };
    
    return mockResponse;
  },
};

// グローバルに追加
// @ts-ignore
global.NextRequest = MockNextRequest;
global.NextResponse = NextResponse;

// FormDataのモック
global.FormData = class MockFormData implements FormData {
  private data: Map<string, any> = new Map();

  append(name: string, value: string | Blob, fileName?: string): void {
    this.data.set(name, value);
  }

  delete(name: string): void {
    this.data.delete(name);
  }

  get(name: string): FormDataEntryValue | null {
    return this.data.get(name) || null;
  }

  getAll(name: string): FormDataEntryValue[] {
    const value = this.data.get(name);
    return value ? [value] : [];
  }

  has(name: string): boolean {
    return this.data.has(name);
  }

  set(name: string, value: string | Blob, fileName?: string): void {
    this.data.set(name, value);
  }

  forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void): void {
    this.data.forEach((value, key) => {
      callbackfn(value, key, this);
    });
  }

  *entries(): IterableIterator<[string, FormDataEntryValue]> {
    yield* this.data.entries();
  }

  *keys(): IterableIterator<string> {
    yield* this.data.keys();
  }

  *values(): IterableIterator<FormDataEntryValue> {
    yield* this.data.values();
  }

  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
    return this.entries();
  }
};

// Blobのモック
class MockBlob implements Blob {
  private data: string;
  private options: BlobPropertyBag;

  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
    this.data = blobParts ? blobParts.join('') : '';
    this.options = options || {};
  }

  get size(): number {
    return this.data.length;
  }

  get type(): string {
    return this.options.type || '';
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    const slicedData = this.data.slice(start, end);
    return new MockBlob([slicedData], { type: contentType || this.type });
  }

  async text(): Promise<string> {
    return this.data;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const buffer = new ArrayBuffer(this.data.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < this.data.length; i++) {
      view[i] = this.data.charCodeAt(i);
    }
    return buffer;
  }

  async stream(): Promise<ReadableStream<Uint8Array>> {
    throw new Error('Method not implemented.');
  }
}

// グローバルにBlobが定義されていない場合のみ定義する
if (typeof global.Blob === 'undefined') {
  // @ts-ignore
  global.Blob = MockBlob;
}

// Fileのモック
class MockFile extends MockBlob implements File {
  name: string;
  lastModified: number;

  constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
    super(fileBits, options);
    this.name = fileName;
    this.lastModified = options?.lastModified || Date.now();
  }
}

// グローバルにFileが定義されていない場合のみ定義する
if (typeof global.File === 'undefined') {
  // @ts-ignore
  global.File = MockFile;
} 