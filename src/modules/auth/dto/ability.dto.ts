import { ApiProperty } from '@nestjs/swagger';
import { Action } from '../../../common/enums/action.enum';
import { Resource } from '../../../common/enums/resource.enum';

export class AbilityDTO {
  @ApiProperty({
    description: 'Ação que pode ser realizada',
    enum: Action,
    example: Action.Create,
  })
  action: Action;

  @ApiProperty({
    description: 'Recurso que pode ser acessado',
    enum: Resource,
    example: Resource.User,
  })
  subject: Resource;
}

export class UserAbilitiesDTO {
  @ApiProperty({
    description: 'Lista de permissões do usuário',
    type: [AbilityDTO],
  })
  abilities: AbilityDTO[];
}
