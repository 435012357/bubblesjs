import 'reflect-metadata'
import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DatabaseModule } from './database/db.module'
import databaseConfig from './config/database.config'
import { AccessSeedService } from './modules/access/seed/access-seed.service'
import { ENV_ARR } from './utils/env-arr'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ENV_ARR, load: [databaseConfig] }),
    DatabaseModule,
  ],
  providers: [AccessSeedService],
})
class AccessInitializationModule {}

async function initialize() {
  const accountIndex = process.argv.indexOf('--account')
  const account = accountIndex >= 0 ? process.argv[accountIndex + 1] : undefined
  if (!account || !/^[A-Za-z0-9_]{4,32}$/.test(account))
    throw new Error('用法：access:init --account <已注册完整账号>')
  const app = await NestFactory.createApplicationContext(AccessInitializationModule, {
    logger: ['error'],
  })
  try {
    const result = await app.get(AccessSeedService).initialize(account)
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } finally {
    await app.close()
  }
}
initialize().then(
  () => process.exit(0),
  (error) => {
    process.stderr.write(`${error instanceof Error ? error.message : '初始化失败'}\n`)
    process.exit(1)
  },
)
