<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-icon"></div>
        <div class="login-subtitle">
          <h1 class="login-title">VWD</h1>
          - 初始化管理员账户
        </div>
        <div class="setup-hint">
          首次使用，请设置管理员账号和密码。设置完成后将自动登录。
        </div>
        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="form-item">
            <label class="form-label">管理员账号</label>
            <input v-model="name" class="form-input" type="text" autocomplete="username" placeholder="至少 2 个字符" />
          </div>
          <div class="form-item">
            <label class="form-label">密码</label>
            <div class="form-input-wrapper">
              <input
                v-model="password"
                class="form-input"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="至少 6 个字符"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
              >
                <PhEye v-if="!showPassword" :size="16" />
                <PhEyeSlash v-else :size="16" />
              </button>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">确认密码</label>
            <div class="form-input-wrapper">
              <input
                v-model="confirmPassword"
                class="form-input"
                :type="showConfirm ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="再次输入密码"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showConfirm ? '隐藏密码' : '显示密码'"
                @click="showConfirm = !showConfirm"
              >
                <PhEye v-if="!showConfirm" :size="16" />
                <PhEyeSlash v-else :size="16" />
              </button>
            </div>
          </div>
          <div v-if="error" class="form-error">{{ error }}</div>
          <button class="form-button" type="submit" :disabled="submitting">
            <span v-if="submitting">设置中...</span>
            <span v-else>完成设置</span>
          </button>
        </form>
      </div>
    </div>
    <div class="login-bg"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { setupAdmin } from "../../api/admin";
import { setSetupStatus } from "../../router";

const router = useRouter();
const name = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirm = ref(false);
const submitting = ref(false);
const error = ref("");

async function handleSubmit() {
  if (!name.value || name.value.trim().length < 2) {
    error.value = "用户名至少 2 个字符";
    return;
  }
  if (!password.value || password.value.length < 6) {
    error.value = "密码至少 6 个字符";
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = "两次输入的密码不一致";
    return;
  }
  error.value = "";
  submitting.value = true;
  try {
    await setupAdmin(name.value.trim(), password.value);
    setSetupStatus(true);
    router.push({ name: "comments" });
  } catch (e: any) {
    error.value = e.message || "设置失败";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="less">
@import "../../styles/components/login.less";

.setup-hint {
  font-size: 13px;
  color: #888;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.6;
  padding: 0 8px;
}
</style>
