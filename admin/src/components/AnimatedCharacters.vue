<template>
  <div class="animated-characters" ref="containerRef">
    <!-- Purple tall rectangle character -->
    <div
      ref="purpleRef"
      class="character character-purple"
      :style="{
        height: (isTyping || isHidingPassword) ? '440px' : '400px',
        transform: purpleTransform,
      }"
    >
      <div class="eyes" :style="{ left: purpleEyesLeft, top: purpleEyesTop }">
        <div
          v-for="i in 2"
          :key="'purple-eye-' + i"
          class="eyeball"
          :style="{
            width: '18px',
            height: isPurpleBlinking ? '2px' : '18px',
          }"
        >
          <div
            v-if="!isPurpleBlinking"
            class="pupil"
            :style="{
              width: '7px',
              height: '7px',
              transform: `translate(${purplePupilX}px, ${purplePupilY}px)`,
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Black tall rectangle character -->
    <div
      ref="blackRef"
      class="character character-black"
      :style="{ transform: blackTransform }"
    >
      <div class="eyes" :style="{ left: blackEyesLeft, top: blackEyesTop }">
        <div
          v-for="i in 2"
          :key="'black-eye-' + i"
          class="eyeball"
          :style="{
            width: '16px',
            height: isBlackBlinking ? '2px' : '16px',
          }"
        >
          <div
            v-if="!isBlackBlinking"
            class="pupil"
            :style="{
              width: '6px',
              height: '6px',
              transform: `translate(${blackPupilX}px, ${blackPupilY}px)`,
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Orange semi-circle character -->
    <div
      ref="orangeRef"
      class="character character-orange"
      :style="{ transform: orangeTransform }"
    >
      <div class="eyes eyes-small" :style="{ left: orangeEyesLeft, top: orangeEyesTop }">
        <div
          v-for="i in 2"
          :key="'orange-pupil-' + i"
          class="pupil-only"
          :style="{
            width: '12px',
            height: '12px',
            transform: `translate(${orangePupilX}px, ${orangePupilY}px)`,
          }"
        ></div>
      </div>
    </div>

    <!-- Yellow tall rectangle character -->
    <div
      ref="yellowRef"
      class="character character-yellow"
      :style="{ transform: yellowTransform }"
    >
      <div class="eyes eyes-small" :style="{ left: yellowEyesLeft, top: yellowEyesTop }">
        <div
          v-for="i in 2"
          :key="'yellow-pupil-' + i"
          class="pupil-only"
          :style="{
            width: '12px',
            height: '12px',
            transform: `translate(${yellowPupilX}px, ${yellowPupilY}px)`,
          }"
        ></div>
      </div>
      <div
        class="mouth"
        :style="{ left: yellowMouthLeft, top: yellowMouthTop }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

const props = withDefaults(
  defineProps<{
    isTyping?: boolean;
    showPassword?: boolean;
    passwordLength?: number;
  }>(),
  {
    isTyping: false,
    showPassword: false,
    passwordLength: 0,
  }
);

const containerRef = ref<HTMLElement | null>(null);
const purpleRef = ref<HTMLElement | null>(null);
const blackRef = ref<HTMLElement | null>(null);
const yellowRef = ref<HTMLElement | null>(null);
const orangeRef = ref<HTMLElement | null>(null);

const mouseX = ref(0);
const mouseY = ref(0);
const isPurpleBlinking = ref(false);
const isBlackBlinking = ref(false);
const isLookingAtEachOther = ref(false);
const isPurplePeeking = ref(false);

let blinkTimers: ReturnType<typeof setTimeout>[] = [];
let lookTimer: ReturnType<typeof setTimeout> | null = null;
let peekTimer: ReturnType<typeof setTimeout> | null = null;

function handleMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
}

function calculatePosition(el: HTMLElement | null) {
  if (!el) return { faceX: 0, faceY: 0, bodySkew: 0 };

  const rect = el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 3;

  const deltaX = mouseX.value - centerX;
  const deltaY = mouseY.value - centerY;

  const faceX = Math.max(-15, Math.min(15, deltaX / 20));
  const faceY = Math.max(-10, Math.min(10, deltaY / 30));
  const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

  return { faceX, faceY, bodySkew };
}

const purplePos = computed(() => calculatePosition(purpleRef.value));
const blackPos = computed(() => calculatePosition(blackRef.value));
const yellowPos = computed(() => calculatePosition(yellowRef.value));
const orangePos = computed(() => calculatePosition(orangeRef.value));

const isHidingPassword = computed(
  () => props.passwordLength > 0 && !props.showPassword
);
const isPeekingMode = computed(
  () => props.passwordLength > 0 && props.showPassword
);

// Purple transforms
const purpleTransform = computed(() => {
  if (isPeekingMode.value) return "skewX(0deg)";
  if (isLookingAtEachOther.value)
    return `skewX(${(purplePos.value.bodySkew || 0) - 12}deg) translateX(40px)`;
  if (props.isTyping || isHidingPassword.value)
    return `skewX(${(purplePos.value.bodySkew || 0) - 12}deg) translateX(40px)`;
  return `skewX(${purplePos.value.bodySkew || 0}deg)`;
});

const purpleEyesLeft = computed(() => {
  if (isPeekingMode.value) return "20px";
  if (isLookingAtEachOther.value) return "55px";
  return `${45 + purplePos.value.faceX}px`;
});
const purpleEyesTop = computed(() => {
  if (isPeekingMode.value) return "35px";
  if (isLookingAtEachOther.value) return "65px";
  return `${40 + purplePos.value.faceY}px`;
});

const purplePupilX = computed(() => {
  if (isPeekingMode.value) return isPurplePeeking.value ? 4 : -4;
  if (isLookingAtEachOther.value) return 3;
  return 0;
});
const purplePupilY = computed(() => {
  if (isPeekingMode.value) return isPurplePeeking.value ? 5 : -4;
  if (isLookingAtEachOther.value) return 4;
  return 0;
});

// Black transforms
const blackTransform = computed(() => {
  if (isPeekingMode.value) return "skewX(0deg)";
  if (isLookingAtEachOther.value)
    return `skewX(${(blackPos.value.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`;
  if (props.isTyping || isHidingPassword.value)
    return `skewX(${(blackPos.value.bodySkew || 0) * 1.5}deg)`;
  return `skewX(${blackPos.value.bodySkew || 0}deg)`;
});

const blackEyesLeft = computed(() => {
  if (isPeekingMode.value) return "10px";
  if (isLookingAtEachOther.value) return "32px";
  return `${26 + blackPos.value.faceX}px`;
});
const blackEyesTop = computed(() => {
  if (isPeekingMode.value) return "28px";
  if (isLookingAtEachOther.value) return "12px";
  return `${32 + blackPos.value.faceY}px`;
});

const blackPupilX = computed(() => {
  if (isPeekingMode.value) return -4;
  if (isLookingAtEachOther.value) return 0;
  return 0;
});
const blackPupilY = computed(() => {
  if (isPeekingMode.value) return -4;
  if (isLookingAtEachOther.value) return -4;
  return 0;
});

// Orange transforms
const orangeTransform = computed(() => {
  if (isPeekingMode.value) return "skewX(0deg)";
  return `skewX(${orangePos.value.bodySkew || 0}deg)`;
});

const orangeEyesLeft = computed(() => {
  if (isPeekingMode.value) return "50px";
  return `${82 + (orangePos.value.faceX || 0)}px`;
});
const orangeEyesTop = computed(() => {
  if (isPeekingMode.value) return "85px";
  return `${90 + (orangePos.value.faceY || 0)}px`;
});

const orangePupilX = computed(() => {
  if (isPeekingMode.value) return -5;
  return 0;
});
const orangePupilY = computed(() => {
  if (isPeekingMode.value) return -4;
  return 0;
});

// Yellow transforms
const yellowTransform = computed(() => {
  if (isPeekingMode.value) return "skewX(0deg)";
  return `skewX(${yellowPos.value.bodySkew || 0}deg)`;
});

const yellowEyesLeft = computed(() => {
  if (isPeekingMode.value) return "20px";
  return `${52 + (yellowPos.value.faceX || 0)}px`;
});
const yellowEyesTop = computed(() => {
  if (isPeekingMode.value) return "35px";
  return `${40 + (yellowPos.value.faceY || 0)}px`;
});

const yellowPupilX = computed(() => {
  if (isPeekingMode.value) return -5;
  return 0;
});
const yellowPupilY = computed(() => {
  if (isPeekingMode.value) return -4;
  return 0;
});

const yellowMouthLeft = computed(() => {
  if (isPeekingMode.value) return "10px";
  return `${40 + (yellowPos.value.faceX || 0)}px`;
});
const yellowMouthTop = computed(() => {
  if (isPeekingMode.value) return "88px";
  return `${88 + (yellowPos.value.faceY || 0)}px`;
});

// Blinking effects
function scheduleBlink(
  callback: () => void,
  reset: () => void
): ReturnType<typeof setTimeout> {
  const interval = Math.random() * 4000 + 3000;
  return setTimeout(() => {
    callback();
    setTimeout(() => {
      reset();
      blinkTimers.push(scheduleBlink(callback, reset));
    }, 150);
  }, interval);
}

// Watch typing
watch(
  () => props.isTyping,
  (typing) => {
    if (typing) {
      isLookingAtEachOther.value = true;
      if (lookTimer) clearTimeout(lookTimer);
      lookTimer = setTimeout(() => {
        isLookingAtEachOther.value = false;
      }, 800);
    } else {
      isLookingAtEachOther.value = false;
    }
  }
);

// Watch password peeking
watch(
  () => [props.passwordLength, props.showPassword, isPurplePeeking.value] as const,
  ([len, show, peeking]) => {
    if (len > 0 && show) {
      if (peekTimer) clearTimeout(peekTimer);
      const interval = Math.random() * 3000 + 2000;
      peekTimer = setTimeout(() => {
        isPurplePeeking.value = true;
        setTimeout(() => {
          isPurplePeeking.value = false;
        }, 800);
      }, interval);
    } else {
      isPurplePeeking.value = false;
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
  blinkTimers.push(
    scheduleBlink(
      () => { isPurpleBlinking.value = true; },
      () => { isPurpleBlinking.value = false; }
    )
  );
  blinkTimers.push(
    scheduleBlink(
      () => { isBlackBlinking.value = true; },
      () => { isBlackBlinking.value = false; }
    )
  );
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  blinkTimers.forEach((t) => clearTimeout(t));
  blinkTimers = [];
  if (lookTimer) clearTimeout(lookTimer);
  if (peekTimer) clearTimeout(peekTimer);
});
</script>

<style scoped lang="less">
.animated-characters {
  position: relative;
  width: 550px;
  height: 400px;
  max-width: 100%;
}

.character {
  position: absolute;
  bottom: 0;
  transition: all 0.7s ease-in-out;
  transform-origin: bottom center;
}

.character-purple {
  left: 70px;
  width: 180px;
  background-color: #6c3ff5;
  border-radius: 10px 10px 0 0;
  z-index: 1;
}

.character-black {
  left: 240px;
  width: 120px;
  height: 310px;
  background-color: #2d2d2d;
  border-radius: 8px 8px 0 0;
  z-index: 2;
}

.character-orange {
  left: 0px;
  width: 240px;
  height: 200px;
  background-color: #ff9b6b;
  border-radius: 120px 120px 0 0;
  z-index: 3;
}

.character-yellow {
  left: 310px;
  width: 140px;
  height: 230px;
  background-color: #e8d754;
  border-radius: 70px 70px 0 0;
  z-index: 4;
}

.eyes {
  position: absolute;
  display: flex;
  gap: 32px;
  transition: all 0.7s ease-in-out;
}

.eyes-small {
  gap: 32px;
  transition: all 0.2s ease-out;
}

.eyeball {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: white;
  overflow: hidden;
  transition: all 0.15s;
}

.pupil {
  border-radius: 50%;
  background-color: #2d2d2d;
  transition: transform 0.1s ease-out;
}

.pupil-only {
  border-radius: 50%;
  background-color: #2d2d2d;
  transition: transform 0.1s ease-out;
}

.mouth {
  position: absolute;
  width: 80px;
  height: 4px;
  background-color: #2d2d2d;
  border-radius: 4px;
  transition: all 0.2s ease-out;
}

@media (max-width: 768px) {
  .animated-characters {
    transform: scale(0.6);
    transform-origin: center bottom;
  }
}
</style>
