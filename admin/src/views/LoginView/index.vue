<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-icon"></div>
        <div class="login-subtitle">
          <h1 class="login-title">VWD Comments</h1>
          <p>{{ t("login.subtitle") }}</p>
        </div>
        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="form-item">
            <label class="form-label">{{ t("login.account") }}</label>
            <input v-model="name" class="form-input" type="text" autocomplete="username" />
          </div>
          <div class="form-item">
            <label class="form-label">{{ t("login.password") }}</label>
            <div class="form-input-wrapper">
              <input
                v-model="password"
                class="form-input"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? t('login.hidePassword') : t('login.showPassword')"
                @click="showPassword = !showPassword"
              >
                <PhEye v-if="!showPassword" :size="16" />
                <PhEyeSlash v-else :size="16" />
              </button>
            </div>
          </div>
          <div v-if="error" class="form-error">{{ error }}</div>
          <button class="form-button" type="submit" :disabled="submitting">
            <span v-if="submitting">{{ t("login.submitting") }}</span>
            <span v-else>{{ t("login.submit") }}</span>
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
import { useI18n } from "vue-i18n";
import { loginAdmin } from "../../api/admin";

const { t } = useI18n();
const router = useRouter();
const name = ref("");
const password = ref("");
const showPassword = ref(false);
const submitting = ref(false);
const error = ref("");

async function handleSubmit() {
  if (!name.value || !password.value) {
    error.value = t("login.errorRequired");
    return;
  }
  error.value = "";
  submitting.value = true;
  try {
    await loginAdmin(name.value, password.value);
    router.push({ name: "stats" });
  } catch (e: any) {
    const msg = e.message || t("login.errorFailed");
    if (msg.includes("尚未初始化") || msg.includes("needSetup")) {
      router.push({ name: "setup" });
      return;
    }
    error.value = msg;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="less">
@import "../../styles/components/login.less";
</style>
