import { requireAdmin } from '../../../../utils/auth'
import { departmentsService } from '../../../../services/departments.service'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })
  const result = await departmentsService.remove(id)
  return apiSuccess({
    success: true,
    message: result.reassignedDepartmentQrCount > 0
      ? `Подразделение удалено. ${result.reassignedDepartmentQrCount} QR переведено в private и откреплено от подразделения.`
      : 'Подразделение удалено.',
    ...result,
  })
})
