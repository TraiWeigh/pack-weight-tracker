{pkgs}: {
  deps = [
    pkgs.udev
    pkgs.libgbm
    pkgs.xorg.libxcb
    pkgs.xorg.libXrandr
    pkgs.xorg.libXfixes
    pkgs.xorg.libXext
    pkgs.xorg.libXdamage
    pkgs.xorg.libXcomposite
    pkgs.xorg.libX11
    pkgs.alsa-lib
    pkgs.cairo
    pkgs.pango
    pkgs.mesa
    pkgs.libdrm
    pkgs.libxkbcommon
    pkgs.expat
    pkgs.cups
    pkgs.at-spi2-core
    pkgs.at-spi2-atk
    pkgs.atk
    pkgs.dbus
    pkgs.nspr
    pkgs.nss
    pkgs.glib
  ];
}
