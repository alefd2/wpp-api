import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Type } from '@nestjs/common';

interface SwaggerResponseOptions {
  type?: Type<any> | [Type<any>];
  isArray?: boolean;
}

export function ApiList(options: {
  summary?: string;
  description?: string;
  response?: SwaggerResponseOptions;
  query?: { name: string; description: string; required?: boolean }[];
}) {
  const decorators = [
    ApiOperation({
      summary: options.summary || 'Listar registros',
      description: options.description || 'Retorna uma lista de registros',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista retornada com sucesso',
      type: options.response?.type,
      isArray: options.response?.isArray ?? true,
    }),
    ApiResponse({
      status: 401,
      description: 'Não autorizado - Token JWT ausente ou inválido',
    }),
  ];

  if (options.query) {
    options.query.forEach((query) => {
      decorators.push(
        ApiQuery({
          name: query.name,
          required: query.required ?? false,
          description: query.description,
        }),
      );
    });
  }

  return applyDecorators(...decorators);
}

export function ApiDetail(options: {
  summary?: string;
  description?: string;
  response?: SwaggerResponseOptions;
}) {
  return applyDecorators(
    ApiOperation({
      summary: options.summary || 'Buscar registro por ID',
      description:
        options.description || 'Retorna um registro específico pelo ID',
    }),
    ApiParam({
      name: 'id',
      description: 'ID do registro',
      type: 'number',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Registro encontrado com sucesso',
      type: options.response?.type,
    }),
    ApiResponse({
      status: 404,
      description: 'Registro não encontrado',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autorizado - Token JWT ausente ou inválido',
    }),
  );
}

export function ApiCreate<T>(options: {
  summary?: string;
  description?: string;
  request?: Type<T>;
  response?: SwaggerResponseOptions;
}) {
  return applyDecorators(
    ApiOperation({
      summary: options.summary || 'Criar novo registro',
      description: options.description || 'Cria um novo registro',
    }),
    ApiBody({
      type: options.request,
      description: 'Dados para criar o registro',
      required: true,
    }),
    ApiResponse({
      status: 201,
      description: 'Registro criado com sucesso',
      type: options.response?.type,
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autorizado - Token JWT ausente ou inválido',
    }),
  );
}

export function ApiUpdate<T>(options: {
  summary?: string;
  description?: string;
  request?: Type<T>;
  response?: SwaggerResponseOptions;
}) {
  return applyDecorators(
    ApiOperation({
      summary: options.summary || 'Atualizar registro',
      description: options.description || 'Atualiza um registro existente',
    }),
    ApiParam({
      name: 'id',
      description: 'ID do registro',
      type: 'number',
      required: true,
    }),
    ApiBody({
      type: options.request,
      description: 'Dados para atualizar o registro',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Registro atualizado com sucesso',
      type: options.response?.type,
    }),
    ApiResponse({
      status: 404,
      description: 'Registro não encontrado',
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autorizado - Token JWT ausente ou inválido',
    }),
  );
}

export function ApiRemove(options: { summary?: string; description?: string }) {
  return applyDecorators(
    ApiOperation({
      summary: options.summary || 'Remover registro',
      description: options.description || 'Remove um registro existente',
    }),
    ApiParam({
      name: 'id',
      description: 'ID do registro',
      type: 'number',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Registro removido com sucesso',
    }),
    ApiResponse({
      status: 404,
      description: 'Registro não encontrado',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autorizado - Token JWT ausente ou inválido',
    }),
  );
}
