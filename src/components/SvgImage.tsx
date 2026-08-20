import React from 'react';
import { Image, ImageProps } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface SvgImageProps extends Omit<ImageProps, 'source'> {
  source: any;
}

export const SvgImage: React.FC<SvgImageProps> = ({ source, style, ...props }) => {
  if (typeof source === 'string' && source.startsWith('data:image/svg+xml')) {
    let xml = '';
    if (source.includes(';utf8,')) {
      // React Native SVG needs the URI decoded string
      const raw = source.split(';utf8,')[1];
      xml = decodeURIComponent(raw);
    } else if (source.includes(';base64,')) {
      const base64 = source.split(';base64,')[1];
      try {
        const g = globalThis as any;
        if (typeof g.Buffer !== 'undefined') {
          xml = g.Buffer.from(base64, 'base64').toString('utf8');
        } else if (typeof atob !== 'undefined') {
          xml = decodeURIComponent(escape(atob(base64)));
        }
      } catch (e) {
        if (typeof atob !== 'undefined') {
          xml = atob(base64);
        }
      }
    }

    if (xml) {
      const resolvedStyle = Array.isArray(style)
        ? Object.assign({}, ...style)
        : (style || {});

      const width = resolvedStyle.width || '100%';
      const height = resolvedStyle.height || '100%';

      return (
        <SvgXml
          xml={xml}
          width={width}
          height={height}
          style={style}
        />
      );
    }
  }

  return <Image source={source} style={style} {...props} />;
};

export default SvgImage;
