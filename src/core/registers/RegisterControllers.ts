import { localJsonStorage } from '../globals';
import { JSONStorageController } from '@/uikit/controllers/JSONStorageController';
import { ProcesserService } from '@/base/services/ProcesserService';
import { UserService } from '@/base/services/UserService';
import { InversifyRegisterInterface } from '../IOC';
import { InversifyContainer } from '../IOC';
import { ChecklistController } from '@/pages/checklist/controllers/ChecklistController';

export class RegisterControllers implements InversifyRegisterInterface {
  register(container: InversifyContainer): void {
    const jsonStorageController = new JSONStorageController(localJsonStorage);
    const checklistController = new ChecklistController();

    container.bind(JSONStorageController, jsonStorageController);
    container.bind(ChecklistController, checklistController);

    container.get(ProcesserService).use(container.get(UserService));
  }
}
