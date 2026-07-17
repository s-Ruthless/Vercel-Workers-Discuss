<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-icon"></div>
        <div class="login-subtitle">
          <h1 class="login-title">VWD Comments</h1>
          <p>{{ t("setup.subtitle") }}</p>
        </div>
        <div class="setup-hint">
          {{ t("setup.hint") }}
        </div>
        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="form-item">
            <label class="form-label">{{ t("setup.account") }}</label>
            <input v-model="name" class="form-input" type="text" autocomplete="username" :placeholder="t('setup.accountPlaceholder')" />
          </div>
          <div class="form-item">
            <label class="form-label">{{ t("setup.password") }}</label>
            <div class="form-input-wrapper">
              <input
                v-model="password"
                class="form-input"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                :placeholder="t('setup.passwordPlaceholder')"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? t('setup.hidePassword') : t('setup.showPassword')"
                @click="showPassword = !showPassword"
              >
                <PhEye v-if="!showPassword" :size="16" />
                <PhEyeSlash v-else :size="16" />
              </button>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">{{ t("setup.confirmPassword") }}</label>
            <div class="form-input-wrapper">
              <input
                v-model="confirmPassword"
                class="form-input"
                :type="showConfirm ? 'text' : 'password'"
                autocomplete="new-password"
                :placeholder="t('setup.confirmPlaceholder')"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showConfirm ? t('setup.hidePassword') : t('setup.showPassword')"
                @click="showConfirm = !showConfirm"
              >
                <PhEye v-if="!showConfirm" :size="16" />
                <PhEyeSlash v-else :size="16" />
              </button>
            </div>
          </div>
          <div v-if="error" class="form-error">{{ error }}</div>
          <button class="form-button" type="submit" :disabled="submitting">
            <span v-if="submitting">{{ t("setup.submitting") }}</span>
            <span v-else>{{ t("setup.submit") }}</span>
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
import { setupAdmin } from "../../api/admin";
import { setSetupStatus } from "../../router";

const { t } = useI18n();
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
    error.value = t("setup.errorNameShort");
    return;
  }
  if (!password.value || password.value.length < 6) {
    error.value = t("setup.errorPasswordShort");
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = t("setup.errorMismatch");
    return;
  }
  error.value = "";
  submitting.value = true;
  try {
    await setupAdmin(name.value.trim(), password.value);
    setSetupStatus(true);
    router.push({ name: "stats" });
  } catch (e: any) {
    error.value = e.message || t("setup.errorFailed");
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="less">
@import "../../styles/components/login.less";
</style>
