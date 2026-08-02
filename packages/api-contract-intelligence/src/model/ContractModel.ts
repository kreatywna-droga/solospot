export interface ContractParameter {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

export interface ContractResponse {
  type: string;
  isAsync: boolean;
}

export interface ContractMethod {
  name: string;
  parameters: ContractParameter[];
  returnType: ContractResponse;
  deprecated?: boolean;
}

export interface ContractInterface {
  name: string;
  properties: ContractParameter[];
  methods: ContractMethod[];
}

export interface ContractVersion {
  versionString: string;
  isDeprecated?: boolean;
}

export interface ContractMetadata {
  author?: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
}

export interface APIContract {
  id: string;
  name: string;
  version: ContractVersion;
  interfaces: ContractInterface[];
  metadata: ContractMetadata;
}
